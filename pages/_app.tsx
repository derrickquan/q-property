// pages/_app.tsx
import type { AppProps } from "next/app";
import "../styles/globals.css";
import { useRouter } from "next/router";
import NavBar from "../components/NavBar";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const showNav = router.pathname !== "/"; // avoid double header on the landing page

  return (
    <>
      {showNav && <NavBar />}
      <Component {...pageProps} />
    </>
  );
}
