import type { Profile as ProfileData } from "../config/types";

export function Profile({ name, avatar, bio, verified }: ProfileData) {
  return (
    <header className="ll-profile">
      {avatar ? <img className="ll-avatar" src={avatar} alt={name} /> : null}
      <h1 className="ll-name">
        <span>{name}</span>
        {verified ? (
          <span className="ll-verified" role="img" aria-label="Verified">
            ✓
          </span>
        ) : null}
      </h1>
      {bio ? <p className="ll-bio">{bio}</p> : null}
    </header>
  );
}
