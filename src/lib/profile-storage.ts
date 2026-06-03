import type { UserProfile } from "../types";

const PROFILE_STORAGE_KEY = "hs_profile";
const PROFILE_UPDATED_EVENT = "hs-profile-updated";

const DEFAULT_PROFILE: UserProfile = {
  // id: "HS-20580415",
  // firstName: "Ahmad",
  // lastName: "Al-Rashidi",
  // name: "Ahmad Al-Rashidi",
  // email: "ahmad@healthsync.app",
  // phoneCountryCode: "+966",
  // phoneNumber: "512345678",
  // gender: "Male",
  // bloodType: "O+",
  // dobDay: "15",
  // dobMonth: "April",
  // dobYear: "1958",
  // age: 66,
  // height: 175,
  // weight: 82,
  // hospitalName: "King Fahad Medical City",
  // healthScore: 78,
  // daysActive: 142,
  // alertsThisMonth: 11,
  // dateOfBirth: "April 15, 1958",
  // medicalConditions: ["Hypertension", "Type 2 Diabetes"],

  id: "",
  firstName: "",
  lastName: "",
  name: "",
  email: "",
  phoneCountryCode: "",
  phoneNumber: "",
  gender: "Male", // قيمة مبدئية اختيارية لحين التحميل
  bloodType: "",
  dobDay: "",
  dobMonth: "",
  dobYear: "",
  age: 0,
  height: 0,
  weight: 0,
  hospitalName: "",
  healthScore: 0, // هيبدأ بـ 0 وأول ما الباكيند يحمل الـ 50 هيتحدث فوراً
  daysActive: 0,
  alertsThisMonth: 0,
  dateOfBirth: "",
  medicalConditions: [], // مصفوفة فارغة لأي أمراض تاريخية
};

function readProfileStorage(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function formatDateOfBirth(day: string, month: string, year: string): string {
  if (!day || !month || !year) return "";
  return `${month} ${day}, ${year}`;
}

export function calculateAge(day: string, month: string, year: string): number {
  const monthIndex = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ].indexOf(month);

  if (!day || monthIndex < 0 || !year) return 0;

  const dob = new Date(Number(year), monthIndex, Number(day));
  if (Number.isNaN(dob.getTime())) return 0;

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthday =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());

  if (!hasHadBirthday) age -= 1;
  return age;
}

export function buildFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim();
}

export function getStoredProfile(): UserProfile {
  const stored = readProfileStorage();
  if (!stored) return DEFAULT_PROFILE;

  const firstName = stored.firstName ?? DEFAULT_PROFILE.firstName;
  const lastName = stored.lastName ?? DEFAULT_PROFILE.lastName;
  const dobDay = stored.dobDay ?? DEFAULT_PROFILE.dobDay;
  const dobMonth = stored.dobMonth ?? DEFAULT_PROFILE.dobMonth;
  const dobYear = stored.dobYear ?? DEFAULT_PROFILE.dobYear;

  return {
    ...DEFAULT_PROFILE,
    ...stored,
    firstName,
    lastName,
    name: stored.name ?? buildFullName(firstName, lastName),
    dobDay,
    dobMonth,
    dobYear,
    dateOfBirth: stored.dateOfBirth ?? formatDateOfBirth(dobDay, dobMonth, dobYear),
    medicalConditions: stored.medicalConditions ?? DEFAULT_PROFILE.medicalConditions,
  };
}

export function saveStoredProfile(profile: UserProfile) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

export function clearStoredProfile() {
  localStorage.removeItem(PROFILE_STORAGE_KEY);
  window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

export { DEFAULT_PROFILE, PROFILE_STORAGE_KEY, PROFILE_UPDATED_EVENT };
