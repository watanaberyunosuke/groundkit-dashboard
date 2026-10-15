// Below the Dive: a link to support the project. The Dive itself is shared with MotherDuck,
// so dashboard-only page furniture lives here.
import "./footer.css";

const KOFI_URL = "https://ko-fi.com/harrybwatson";

export default function Footer() {
  return (
    <footer className="gk-footer">
      <a href={KOFI_URL} target="_blank" rel="noreferrer">Support GroundKit on Ko-fi</a>
    </footer>
  );
}
