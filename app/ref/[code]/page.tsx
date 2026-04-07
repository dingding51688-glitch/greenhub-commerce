import { redirect } from "next/navigation";

type ReferralParams = {
  params: {
    code?: string;
  };
};

export default function ReferralRedirectPage({ params }: ReferralParams) {
  const code = params.code?.trim();
  if (!code) {
    redirect("/invite");
  }
  redirect(`/invite?ref=${encodeURIComponent(code)}`);
}
