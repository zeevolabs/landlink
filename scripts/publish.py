#!/usr/bin/env python3
# /// script
# requires-python = ">=3.10"
# ///
"""Build and publish landlink packages to npm.

Usage:
    uv run scripts/publish.py build      # Build all packages
    uv run scripts/publish.py bump       # Bump alpha.N, build, and publish modified packages
    uv run scripts/publish.py release    # Remove -alpha.N, build, and publish as stable
    uv run scripts/publish.py publish    # Build and publish modified packages (no version change)
    uv run scripts/publish.py --dry-run  # Preview what would happen without executing

Auth:
    --otp=CODE       Use a one-time password for 2FA
    --token=TOKEN    Use an npm access token (skips OTP)
    NPM_TOKEN env    Fallback if --token is not passed
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PACKAGES_DIR = ROOT / "packages"

BUILD_ORDER = ["landlink", "admin", "store-fs", "store-vercel-blob"]


def _mask(cmd: list[str]) -> str:
    return " ".join(
        a.split("=")[0] + "=***" if "_authToken=" in a else a
        for a in cmd
    )


def run(cmd: list[str], cwd: Path | None = None, check: bool = True) -> subprocess.CompletedProcess[str]:
    print(f"  $ {_mask(cmd)}")
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, check=check)


def read_pkg(pkg_dir: Path) -> dict:
    return json.loads((pkg_dir / "package.json").read_text())


def write_pkg(pkg_dir: Path, data: dict) -> None:
    (pkg_dir / "package.json").write_text(json.dumps(data, indent=2) + "\n")


def get_version(pkg_dir: Path) -> str:
    return read_pkg(pkg_dir)["version"]


def get_name(pkg_dir: Path) -> str:
    return read_pkg(pkg_dir)["name"]


def version_exists_on_registry(name: str, version: str) -> bool:
    result = run(["npm", "view", f"{name}@{version}", "version"], check=False)
    return result.returncode == 0 and result.stdout.strip() == version


def bump_alpha(version: str) -> str:
    m = re.match(r"^(\d+\.\d+\.\d+)-alpha\.(\d+)$", version)
    if m:
        return f"{m.group(1)}-alpha.{int(m.group(2)) + 1}"
    m = re.match(r"^(\d+\.\d+\.\d+)$", version)
    if m:
        parts = version.split(".")
        minor = int(parts[1]) + 1
        return f"{parts[0]}.{minor}.0-alpha.1"
    raise ValueError(f"Cannot bump version: {version}")


def strip_alpha(version: str) -> str:
    m = re.match(r"^(\d+\.\d+\.\d+)-alpha\.\d+$", version)
    if m:
        return m.group(1)
    return version


def set_version(pkg_dir: Path, new_version: str) -> None:
    data = read_pkg(pkg_dir)
    data["version"] = new_version
    write_pkg(pkg_dir, data)


def resolve_workspace_refs() -> None:
    """Replace workspace:* in peerDependencies with real versions from sibling packages."""
    versions: dict[str, str] = {}
    for pkg_name in BUILD_ORDER:
        pkg_dir = PACKAGES_DIR / pkg_name
        if pkg_dir.exists():
            versions[get_name(pkg_dir)] = get_version(pkg_dir)

    for pkg_name in BUILD_ORDER:
        pkg_dir = PACKAGES_DIR / pkg_name
        if not pkg_dir.exists():
            continue
        data = read_pkg(pkg_dir)
        changed = False
        for dep_section in ("peerDependencies", "dependencies"):
            deps = data.get(dep_section, {})
            for dep_name, dep_version in list(deps.items()):
                if dep_version.startswith("workspace:"):
                    real_version = versions.get(dep_name)
                    if real_version:
                        deps[dep_name] = f">={real_version}"
                        changed = True
        if changed:
            write_pkg(pkg_dir, data)
            print(f"  Resolved workspace refs in {get_name(pkg_dir)}")


def build_all() -> bool:
    print("\n=== Building all packages ===\n")
    for pkg_name in BUILD_ORDER:
        pkg_dir = PACKAGES_DIR / pkg_name
        if not pkg_dir.exists():
            continue
        print(f"Building {pkg_name}...")
        result = run(["npx", "tsup"], cwd=pkg_dir, check=False)
        if result.returncode != 0:
            print(f"  FAILED: {result.stderr}")
            return False
        print(f"  OK")
    return True


def publish_modified(dry_run: bool = False, otp: str | None = None, token: str | None = None) -> None:
    print("\n=== Publishing packages ===\n")
    published = 0
    skipped = 0
    to_publish: list[tuple[Path, str, str, str]] = []

    for pkg_name in BUILD_ORDER:
        pkg_dir = PACKAGES_DIR / pkg_name
        if not pkg_dir.exists():
            continue

        name = get_name(pkg_dir)
        version = get_version(pkg_dir)
        is_alpha = "-alpha." in version
        tag = "alpha" if is_alpha else "latest"

        if version_exists_on_registry(name, version):
            print(f"  {name}@{version} — already published, skipping")
            skipped += 1
            continue

        to_publish.append((pkg_dir, name, version, tag))

    if not to_publish:
        print("Nothing to publish.")
        return

    if not dry_run and not token and not otp:
        otp = input("\nEnter npm OTP code: ").strip()

    for pkg_dir, name, version, tag in to_publish:
        print(f"  {name}@{version} — publishing with --tag {tag}")
        if dry_run:
            print(f"  (dry run, skipping)")
            published += 1
            continue

        cmd = ["npm", "publish", "--access", "public", "--tag", tag]
        if token:
            cmd.append(f"--//registry.npmjs.org/:_authToken={token}")
        elif otp:
            cmd.extend(["--otp", otp])

        result = run(cmd, cwd=pkg_dir, check=False)
        if result.returncode != 0:
            stderr = result.stderr.strip()
            if not token and "EOTP" in stderr:
                print(f"  OTP expired, requesting new code...")
                otp = input("  Enter new OTP code: ").strip()
                result = run(
                    ["npm", "publish", "--access", "public", "--tag", tag, "--otp", otp],
                    cwd=pkg_dir, check=False,
                )
                if result.returncode != 0:
                    print(f"  FAILED: {result.stderr.strip()}")
                    continue
            else:
                print(f"  FAILED: {stderr}")
                continue
        print(f"  OK")
        published += 1

    print(f"\nPublished: {published}, Skipped: {skipped}")


def cmd_build() -> None:
    if not build_all():
        sys.exit(1)
    print("\nAll packages built successfully.")


def cmd_bump(dry_run: bool = False, otp: str | None = None, token: str | None = None) -> None:
    print("\n=== Bumping alpha versions ===\n")
    for pkg_name in BUILD_ORDER:
        pkg_dir = PACKAGES_DIR / pkg_name
        if not pkg_dir.exists():
            continue
        old = get_version(pkg_dir)
        new = bump_alpha(old)
        print(f"  {get_name(pkg_dir)}: {old} -> {new}")
        if not dry_run:
            set_version(pkg_dir, new)

    if not dry_run:
        resolve_workspace_refs()
        if not build_all():
            sys.exit(1)
        publish_modified(dry_run, otp, token)
    else:
        print("\n(dry run, no files changed)")


def cmd_release(dry_run: bool = False, otp: str | None = None, token: str | None = None) -> None:
    print("\n=== Releasing stable versions ===\n")
    for pkg_name in BUILD_ORDER:
        pkg_dir = PACKAGES_DIR / pkg_name
        if not pkg_dir.exists():
            continue
        old = get_version(pkg_dir)
        new = strip_alpha(old)
        if old == new:
            print(f"  {get_name(pkg_dir)}: {old} (already stable)")
            continue
        print(f"  {get_name(pkg_dir)}: {old} -> {new}")
        if not dry_run:
            set_version(pkg_dir, new)

    if not dry_run:
        resolve_workspace_refs()
        if not build_all():
            sys.exit(1)
        publish_modified(dry_run, otp, token)
    else:
        print("\n(dry run, no files changed)")


def cmd_publish(dry_run: bool = False, otp: str | None = None, token: str | None = None) -> None:
    resolve_workspace_refs()
    if not build_all():
        sys.exit(1)
    publish_modified(dry_run, otp, token)


def main() -> None:
    args = sys.argv[1:]
    dry_run = "--dry-run" in args
    args = [a for a in args if a != "--dry-run"]

    otp = None
    for a in args:
        if a.startswith("--otp="):
            otp = a.split("=", 1)[1]
    args = [a for a in args if not a.startswith("--otp=")]

    env_file = ROOT / ".env"
    if env_file.exists():
        for line in env_file.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                if v:
                    os.environ.setdefault(k.strip(), v.strip())

    token = os.environ.get("NPM_TOKEN") or None
    for a in args:
        if a.startswith("--token="):
            token = a.split("=", 1)[1]
    args = [a for a in args if not a.startswith("--token=")]

    if not args:
        print(__doc__)
        sys.exit(0)

    command = args[0]
    commands = {
        "build": lambda: cmd_build(),
        "bump": lambda: cmd_bump(dry_run, otp, token),
        "release": lambda: cmd_release(dry_run, otp, token),
        "publish": lambda: cmd_publish(dry_run, otp, token),
    }

    if command not in commands:
        print(f"Unknown command: {command}")
        print(f"Available: {', '.join(commands)}")
        sys.exit(1)

    commands[command]()


if __name__ == "__main__":
    main()
