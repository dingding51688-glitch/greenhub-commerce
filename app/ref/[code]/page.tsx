import { redirect } from "next/navigation";

type ReferralParams = {
  params: {
    code?: string;
  };
};

export default function ReferralRedirectPage({ params }: ReferralParams) {
  const code = params.code?.trim();
  if (!code) {
    redirect("/");
  }
  // Redirect to homepage with ref param — client-side code will store the code
  redirect(`/?ref=${encodeURIComponent(code)}`);
}
