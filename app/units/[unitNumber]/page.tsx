import Link from "next/link";
import { notFound } from "next/navigation";
import { ReservationSidebar } from "@/components/reservation/ReservationSidebar";
import { UnitWorkspace } from "@/components/units/UnitWorkspace";
import { getApartments, getEsubDetails } from "@/lib/apartments";
import { apartments as apartmentMetadata } from "@/lib/data";
import { formatArea, formatPrice } from "@/lib/format";

export function generateStaticParams() {
  return apartmentMetadata.map((unit) => ({ unitNumber: unit.number_num }));
}

const salesData = [
  {
    name: "Ahmed Ibraheem",
    role: "Customer Relations Manager",
    tel: "+372 5944 4444",
    whatsappLink: "https://wa.me/3725944444?text=Hello%20Diana%2C%20I%20am%20interested%20in%20unit%2061%20at%20Krulli%2010.",
    email: "ahmed@myxellia.io",
    img: "/assets/ahmed.jpg",
  },
  {
    name: "David Peter",
    role: "Sales Manager",
    tel: "+372 5944 4555",
    whatsappLink: "https://wa.me/3725944555?text=Hello%20Martin%2C%20I%20am%20interested%20in%20unit%2061%20at%20Krulli%2010.",
    email: "david@myxellia.io",
    img: "/assets/peter.png",
  },
];

const finishingByUnit: Record<string, string> = {
  "9": "Stuudio 1",
  "37": "Deluxe 3",
  "41": "Deluxe 3",
  "46": "Deluxe 4",
  "50": "Deluxe 4",
};

export default async function UnitPage({ params }: { params: Promise<{ unitNumber: string }> }) {
  const { unitNumber } = await params;
  const apartments = await getApartments();
  const esubDetails = await getEsubDetails();
  const unit = apartments.find((apartment) => Number(apartment.number_num) === Number(unitNumber));
  if (!unit) notFound();

  const modelNumber = Number(unit.number_num);
  const modelPath = modelNumber >= 37 && modelNumber <= 50 ? `/volta-uus-7/unit-models/${modelNumber}.glb` : null;
  const planPath = `/volta-uus-7/unit-plans/${modelNumber}.svg`;
  const unitKind = Object.values(unit.function).find(Boolean) || "Apartment";
  const finishing = finishingByUnit[unit.number_num] || "-";
  const ceilingHeight = unit.floor === "3" ? "up to 3.2 m" : "-";
  const terrace = unit.balcony_size_raw ? `${unit.balcony_size_raw.replace(".", ",")} m²` : "-";
  const salesSubject = encodeURIComponent(`Myxellia unit ${unit.number}`);

  return (
    <div className="unit-page">
      <aside className="unit-details">
        <header className="unit-brandbar">
          <Link href="/" aria-label="Back to all units">
            <span aria-hidden="true">←</span>
          </Link>
        </header>

        <section className="unit-summary">
          <div className="unit-heading">
            <small>{unit.house.name} · Tallinn</small>
            <h1>{unit.number}</h1>
            <p>{unitKind}</p>
          </div>

          <dl className="unit-facts unit-facts-reference">
            <div>
              <dt>Floor</dt>
              <dd>{unit.floor}</dd>
            </div>
            <div>
              <dt>Rooms</dt>
              <dd>{unit.rooms_count || "-"}</dd>
            </div>
            <div>
              <dt>Size</dt>
              <dd>{formatArea(unit)}</dd>
            </div>
            <div>
              <dt>Terrace</dt>
              <dd>{terrace}</dd>
            </div>
            <div>
              <dt>Finishing</dt>
              <dd>{finishing}</dd>
            </div>
            <div>
              <dt>Ceiling height</dt>
              <dd>{ceilingHeight}</dd>
            </div>
            <div className="unit-fact-price">
              <dt>Price</dt>
              <dd>{formatPrice(unit)}</dd>
            </div>
          </dl>

          <nav className="unit-resource-links" aria-label="Unit resources">
            <a href="#unit-stage">
              <span aria-hidden="true">▦</span> Explore floor plan
            </a>
            <a href="#unit-stage">
              <span aria-hidden="true">◇</span> View 3D and interior
            </a>
          </nav>
        </section>
      </aside>

      <UnitWorkspace unit={unit} floorUnits={apartments} modelPath={modelPath} planPath={planPath} />

      <ReservationSidebar
        esubDetails={esubDetails}
        unitId={unit?.unit}
        allocationId={unit?.id}
        unitNumber={unit.number}
        propertyName={unit.house.name}
        available={!unit.allocated}
        salesSubject={salesSubject}
        contacts={salesData}
      />
    </div>
  );
}
