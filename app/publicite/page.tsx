import { redirect } from "next/navigation";

export default function PublicitePage() {
  redirect("/dashboard?panel=campaigns");
}
