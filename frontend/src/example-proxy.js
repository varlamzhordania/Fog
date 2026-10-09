import {NextResponse} from "next/server";

export const config = {
  // Everything except the Next.js internals, the media reverse-proxy rewrite, the revalidation
  // webhook and anything with a file extension. Those never render a layout, so the headers would
  // be dead weight on exactly the paths that are hit most often.
  matcher: ["/((?!_next/|media/|api/|.*\.[\w]+$).*)"],
};

export function exampleProxy(request) {
  const headers = new Headers(request.headers);

  return NextResponse.next({ request: { headers } });
}

