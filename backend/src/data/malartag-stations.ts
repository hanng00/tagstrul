/**
 * Stations on the Mälartåg network. `signature` is Trafikverket's LocationSignature,
 * which Mälardalstrafik's claim form also uses as its station code. `claimStationId` is the
 * claim form's own station id. Taken from the claim form's /api/TrainStations on 2026-11-27.
 */
export interface MalartagStation {
  name: string;
  uic?: string;
  signature: string;
  claimStationId: string;
}

export const MALARTAG_STATIONS: MalartagStation[] = [
  { name: 'Arboga', uic: '740000262', signature: 'Arb', claimStationId: '51bae9d5-7357-4bde-b65a-2a6421f6ddaf' },
  { name: 'Arlanda C', uic: '740000556', signature: 'Arnc', claimStationId: '35dbb7a3-3d2e-4b02-afa1-3d2ecd2dd522' },
  { name: 'Eskilstuna C', uic: '740000170', signature: 'Et', claimStationId: 'd6b57a4b-5e76-48e2-91f0-9dc4200f413a' },
  { name: 'Flemingsberg', uic: '740000031', signature: 'Flb', claimStationId: '255f89db-d0b2-478c-83bc-2badfbdae1c7' },
  { name: 'Flen', uic: '740000288', signature: 'Fle', claimStationId: '9266eb15-3e19-4609-8276-f2dd8e29652a' },
  { name: 'Furuvik', uic: '740001061', signature: 'Fvk', claimStationId: '8751e52c-2214-4c1d-b64b-1d3eefc524b9' },
  { name: 'Gnesta', uic: '740000694', signature: 'Gn', claimStationId: '11fed1ac-99e8-475e-ad29-bea03ef5468b' },
  { name: 'Gävle C', uic: '740000210', signature: 'Gä', claimStationId: 'c1ed2e95-5cc2-4e9d-a89b-fb27f01ad527' },
  { name: 'Hallsberg', uic: '740000077', signature: 'Hpbg', claimStationId: '9be010f0-4dab-441d-b186-35a588aae86e' },
  { name: 'Heby', uic: '740000674', signature: 'Hy', claimStationId: '8e0778d5-074a-41df-9234-a84ab54a279c' },
  { name: 'Hälleforsnäs', uic: '740000738', signature: 'Hnä', claimStationId: 'cc45391c-b5c6-4cae-8244-e27c247dd1b3' },
  { name: 'Katrineholm C', uic: '740000166', signature: 'K', claimStationId: '3f0a3b44-86e1-48da-9c6a-6a95879409cc' },
  { name: 'Knivsta', uic: '740000559', signature: 'Kn', claimStationId: '18df975c-61be-4029-94cd-fc565b0da4d9' },
  { name: 'Kolbäck', uic: '740000321', signature: 'Kbä', claimStationId: 'b32a0d80-333d-4132-af1b-3347c7c25932' },
  { name: 'Kolmården', uic: '740001545', signature: 'Kon', claimStationId: '8276f617-db04-4215-b9ac-a67957ee7037' },
  { name: 'Kungsör', uic: '740000676', signature: 'Kör', claimStationId: 'eb816eb7-19ec-40bc-851c-3b7b24559a86' },
  { name: 'Kvicksund', uic: '740000677', signature: 'Ksus', claimStationId: 'd21e77d1-ba66-4ead-80b5-eb96904a0852' },
  { name: 'Linköping C', uic: '740000009', signature: 'Lp', claimStationId: '97455149-d0e5-4f76-9692-9b329027db58' },
  { name: 'Läggesta', uic: '740000067', signature: 'Lg', claimStationId: '60f38bae-43cd-4a45-a7d2-3d872f4fc035' },
  { name: 'Marma', uic: '740000627', signature: 'Maa', claimStationId: 'a363d1db-64ab-4058-8838-2a6dbcd17666' },
  { name: 'Mehedeby', uic: '740001573', signature: 'Meh', claimStationId: '0a3e54c9-3189-4f1d-8cf7-ecb3a6b6448f' },
  { name: 'Morgongåva', uic: '740000736', signature: 'Må', claimStationId: 'f93f2964-e736-4442-9fa0-78a63b3c555e' },
  { name: 'Märsta', uic: '740000027', signature: 'Mr', claimStationId: '57d62e84-ab78-437f-bd59-7e5839de3ce4' },
  { name: 'Norrköping C', uic: '740000007', signature: 'Nr', claimStationId: 'eaf9aa85-16d0-408c-9991-b4e7819427c2' },
  { name: 'Nykvarn', uic: '740000149', signature: 'Nkv', claimStationId: '78958a8a-7543-4b66-bd51-db8d0c0b7d3c' },
  { name: 'Nyköping C', uic: '740000050', signature: 'Nk', claimStationId: '37dbffb4-519c-4fbd-b8c4-171e0367b848' },
  { name: 'Ransta', uic: '740000679', signature: 'Rt', claimStationId: 'd8d9d78d-f2b9-4705-b3f0-41bbdb0edcae' },
  { name: 'Sala', uic: '740000214', signature: 'Sl', claimStationId: '12b6bb4b-2c7d-4817-b17f-a42d8593c04a' },
  { name: 'Skutskär', uic: '740021861', signature: 'Sur', claimStationId: '9523c64f-ab60-477c-807b-2b5c4d068042' },
  { name: 'Skyttorp', uic: '740000438', signature: 'Syt', claimStationId: '708a1953-dd8c-4740-b857-33d3ea8cbffe' },
  { name: 'Stockholm Central', uic: '740000001', signature: 'Cst', claimStationId: 'f4d25596-a9f9-41a1-b200-713439d92fc4' },
  { name: 'Storvreta', uic: '740000392', signature: 'Srv', claimStationId: 'ddf64ca1-b3b3-4820-94fb-137f17fbefc3' },
  { name: 'Strängnäs', uic: '740000108', signature: 'Sgs', claimStationId: '83bb841b-f5c7-4faf-bdea-9324c2e4460f' },
  { name: 'Södertälje Syd', uic: '740000055', signature: 'Söö', claimStationId: 'ad5bfd5a-c481-4389-ab1d-1a0200b9475a' },
  { name: 'Tierp', uic: '740000301', signature: 'Tip', claimStationId: 'da730f09-261d-4840-a113-da466fab32e3' },
  { name: 'Tobo', uic: '740001345', signature: 'Tbo', claimStationId: 'f62a8730-cb37-4e76-b827-e6103f27fcc1' },
  { name: 'Uppsala C', uic: '740000005', signature: 'U', claimStationId: 'cf09cbb1-fd82-4b83-9c09-87bc8fc2f018' },
  { name: 'Vagnhärad', uic: '740000605', signature: 'Vhd', claimStationId: '636fa98b-9ade-45bb-8a5d-e3d715d7a243' },
  { name: 'Vattholma', uic: '740000458', signature: 'Vha', claimStationId: '1fedd7f3-7ed7-4f57-b94f-f1065710d3c6' },
  { name: 'Vingåker', uic: '740000839', signature: 'Vr', claimStationId: '820e2727-5d68-47d5-a70e-2af8e3e9a08f' },
  { name: 'Västerås C', uic: '740000099', signature: 'Vå', claimStationId: '3c7df2d4-ef51-4a24-9e59-305826c0bd44' },
  { name: 'Älvkarleby', uic: '740001578', signature: 'Äkb', claimStationId: '2db97ae5-18fa-4fd0-9809-1b821b434db7' },
  { name: 'Örbyhus', uic: '740000476', signature: 'Öh', claimStationId: '288193e1-37f9-4cc7-94f6-c730ce75c98f' },
  { name: 'Örebro C', uic: '740000133', signature: 'Ör', claimStationId: '83700a23-8407-4831-9c46-41a9ae05d730' },
  { name: 'Örebro Södra', signature: 'Öb', claimStationId: '15b41dab-770b-4611-b855-540373b34a61' },
];

const byUic = new Map(MALARTAG_STATIONS.filter((s) => s.uic).map((s) => [s.uic!, s]));

export function malartagStationByUic(uic: string): MalartagStation | undefined {
  return byUic.get(uic);
}
