/**
 * An Unsplash photo per recipe, hotlinked from images.unsplash.com.
 * They set the mood for the dish; none is a photo of the recipe itself.
 */
export type Photo = { id: string; by: string };

export const PHOTOS: Record<string, Photo> = {
  "sadza-beef-stew": { id: "1608500218861-01091cdc501e", by: "Nathan Dumlao" },
  "sadza-chicken-stew": { id: "1764304733301-3a9f335f0c67", by: "Kalindu Waranga" },
  "rice-chicken-stew": { id: "1708782344490-9026aaa5eec7", by: "Rimsha Noor" },
  "peanut-butter-rice-chicken": { id: "1631515243349-e0cb75fb8d3a", by: "Mario Raj" },
  "roast-chicken-butternut": { id: "1598103442097-8b74394b95c6", by: "Anshu A" },
  "chicken-curry": { id: "1742599361574-6fb156181466", by: "Imad 786" },
  "chicken-cabbage-stirfry": { id: "1772693471187-6e7d364f99ee", by: "Mohammad Fahim" },
  "chicken-mince-gravy": { id: "1603496987351-f84a3ba5ec85", by: "Dr Muhammad Amer" },
  oxtail: { id: "1445979323117-80453f573b71", by: "yvonne lee harijanto" },
  "beef-cabbage": { id: "1608500219063-e5164085cd6f", by: "Nathan Dumlao" },
  "mince-potatoes": { id: "1664339030060-191ccb53b5d2", by: "Holly Spangler" },
  "macaroni-mince": { id: "1608897013039-887f21d8c804", by: "Aleksandra Tanasiienko" },
  "spaghetti-mince": { id: "1673442635965-34f1b36d8944", by: "Sofia Ciravegna" },
  "mince-greens": { id: "1591386767153-987783380885", by: "Artur Kornakov" },
  "steak-gravy": { id: "1633436375795-12b3b339712f", by: "Parnis Azimi" },
  "sausage-pap": { id: "1695089028626-454c6abf5aa6", by: "Kelsey Todd" },
  "lamb-stew": { id: "1694579740719-0e601c5d2437", by: "Raman" },
  "fried-fish-sadza": { id: "1725393325387-07f0d4951528", by: "Francisca Dzise" },
  "fish-stew-rice": { id: "1665401015549-712c0dc5ef85", by: "Keesha's Kitchen" },
  "baked-salmon": { id: "1467003909585-2f8a72700288", by: "Casey Lee" },
  "tinned-fish-stew": { id: "1666181551815-b9adecb24e46", by: "Keesha's Kitchen" },
  "tuna-macaroni": { id: "1598866594230-a7c12756260f", by: "Danijela Prijovic" },
  "bean-stew": { id: "1698917467449-08bcd1d9014b", by: "David de Andrés Martín" },
  "greens-peanut-butter": { id: "1559852925-6a5a7125525b", by: "Kim Daniels" },
  "egg-tomato": { id: "1736172448966-ece3c64ef88f", by: "Ivan Cherepanov" },
};

/** Unsplash crops and resizes on its own servers, so each tile asks only for the pixels it shows. */
export function photoUrl(photo: Photo, width: number, height: number): string {
  return `https://images.unsplash.com/photo-${photo.id}?auto=format&fit=crop&q=70&w=${width}&h=${height}`;
}
