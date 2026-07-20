import type { Profile as ProfileData } from "../config/types";
import type { LandlinkStrings } from "../strings";

export function Profile({ name, avatar, bio, verified, strings }: ProfileData & { strings: LandlinkStrings }) {
  return (
    <header className="ll-profile">
      {avatar ? <img className="ll-avatar" src={avatar} alt={name} /> : null}
      <h1 className="ll-name">
        <span>{name}</span>
        {verified ? (
          <span className="ll-verified" role="img" aria-label={strings.verifiedLabel}>
            ✓
          </span>
        ) : null}
      </h1>
      {bio ? <p className="ll-bio">{bio}</p> : null}
    </header>
  );
}
