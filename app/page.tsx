import { HomeExplorer } from "@/components/home/HomeExplorer";
import { getApartments } from "@/lib/apartments";

export default async function HomePage() {
  const apartments = await getApartments();
  return <HomeExplorer apartments={apartments} />;
}
