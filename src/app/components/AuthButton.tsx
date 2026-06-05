"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSignOut } from "@fortawesome/free-solid-svg-icons";
export default function AuthButton() {
  const { data: session, status } = useSession();

  if (status == "loading") return <span>loading...</span>;

  if (session) {
    return (
      <div className="auth-user">
        <img
          className="auth-avatar"
          src={session.user?.image ?? undefined}
          alt={session.user?.name ?? "user"}
        />
        <span className="auth-name">{session.user?.name}</span>
        <button className="auth-signout" onClick={() => signOut()}>
          <FontAwesomeIcon icon={faSignOut} />
        </button>
      </div>
    );
  }
  return (
    <button className="auth-signin-btn" onClick={() => signIn("google")}>
      <img
        src="https://www.google.com/favicon.ico"
        alt="Google"
        width={16}
        height={16}
      />
      Use Google to Sign In
    </button>
  );
}
