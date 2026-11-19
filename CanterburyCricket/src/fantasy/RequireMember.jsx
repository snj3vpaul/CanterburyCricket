import { Navigate, useLocation } from "react-router-dom";
import { useMember } from "./MemberContext";

/** Route guard: members only (and admins only when `admin` is set). The API enforces the same rules. */
export default function RequireMember({ admin = false, children }) {
  const { member, loading } = useMember();
  const location = useLocation();

  if (loading) {
    return (
      <div className="fx-page">
        <p className="fx-muted" aria-busy="true">Checking your membership…</p>
      </div>
    );
  }
  if (!member) {
    const next = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/member-login?next=${next}`} replace />;
  }
  if (admin && member.role !== "ADMIN") return <Navigate to="/fantasy" replace />;
  return children;
}
