import { formatDistanceToNow } from "date-fns";

export const timeAgo = (date: string | Date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const formatRupees = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export const isExpired = (createdAt: string) => {
  const days = (Date.now() - new Date(createdAt).getTime()) / 86400000;
  return days > 30;
};

export const whatsappLink = (phone: string, msg: string) => {
  const clean = phone.replace(/\D/g, "");
  return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
};

export const AMENITIES = ["WiFi", "AC", "Washing Machine", "Parking", "Furnished", "Kitchen"];

export const CATEGORIES: { value: string; label: string }[] = [
  { value: "books", label: "Books & Notes" },
  { value: "electronics", label: "Electronics" },
  { value: "furniture", label: "Furniture" },
  { value: "vehicles", label: "Cycles & Vehicles" },
  { value: "clothes", label: "Clothes" },
  { value: "sports", label: "Sports & Fitness" },
  { value: "other", label: "Other" },
];

export const CONDITIONS: { value: string; label: string }[] = [
  { value: "like_new", label: "Like New" },
  { value: "good", label: "Good" },
  { value: "fair", label: "Fair" },
];
