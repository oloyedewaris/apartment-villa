import { HomeExplorer } from "@/components/home/HomeExplorer";
import { getApartments } from "@/lib/apartments";
import { planRegistry } from "@/lib/data";

export default async function HomePage() {
  const apartments = await getApartments();
  return <HomeExplorer apartments={apartments} plans={planRegistry} />;
}
