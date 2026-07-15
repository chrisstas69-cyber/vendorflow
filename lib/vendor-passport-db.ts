import { prisma } from '@/lib/prisma';
import type { VendorDocument } from '@/lib/documents';
import type { VendorPassport, VendorLogistics } from '@/lib/vendor-passport';
import { validatePassport } from '@/lib/vendor-passport';

function parseJsonArray(raw: string): string[] {
  try {
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function prismaRowToPassport(row: {
  id: string;
  vendorEmail: string;
  businessName: string;
  dba: string | null;
  contactName: string;
  phone: string;
  website: string | null;
  description: string;
  categories: string;
  serviceTags: string;
  validationState: string;
  complianceScore: number;
  insuranceExpiry: Date | null;
  setupPhotoUrl: string | null;
  vehicleType: string;
  trailerLengthFt: number | null;
  boothWidthFt: number | null;
  boothDepthFt: number | null;
  needsElectric: boolean;
  ampRequirement: string | null;
  setupTimeMinutes: number | null;
  waterAccess: boolean | null;
  generatorOk: boolean | null;
  createdAt: Date;
  updatedAt: Date;
  documents: {
    id: string;
    type: string;
    fileName: string;
    fileUrl: string | null;
    status: string;
    uploadedAt: Date;
    expiresAt: Date | null;
  }[];
}): VendorPassport {
  const logistics: VendorLogistics = {
    vehicleType: row.vehicleType as VendorLogistics['vehicleType'],
    trailerLengthFt: row.trailerLengthFt ?? undefined,
    boothWidthFt: row.boothWidthFt ?? undefined,
    boothDepthFt: row.boothDepthFt ?? undefined,
    needsElectric: row.needsElectric,
    ampRequirement: row.ampRequirement ?? undefined,
    setupTimeMinutes: row.setupTimeMinutes ?? undefined,
    waterAccess: row.waterAccess ?? undefined,
    generatorOk: row.generatorOk ?? undefined,
  };

  const documents: VendorDocument[] = row.documents.map(d => ({
    id: d.id,
    type: d.type as VendorDocument['type'],
    fileName: d.fileName,
    uploadedAt: d.uploadedAt.toISOString(),
  }));

  return {
    id: row.id,
    vendorEmail: row.vendorEmail,
    businessName: row.businessName,
    dba: row.dba ?? undefined,
    contactName: row.contactName,
    phone: row.phone,
    website: row.website ?? undefined,
    description: row.description,
    categories: parseJsonArray(row.categories),
    serviceTags: parseJsonArray(row.serviceTags),
    logistics,
    documents,
    setupPhotoUrl: row.setupPhotoUrl ?? undefined,
    insuranceExpiry: row.insuranceExpiry?.toISOString().slice(0, 10),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function loadPassportFromDb(vendorEmail: string): Promise<VendorPassport | null> {
  try {
    const { isHostedDatabaseUrl } = await import('@/lib/prisma');
    if (!isHostedDatabaseUrl()) return null;
    const row = await prisma.vendorPassport.findUnique({
      where: { vendorEmail },
      include: { documents: true },
    });
    return row ? prismaRowToPassport(row) : null;
  } catch {
    return null;
  }
}

export async function persistPassportToDb(passport: VendorPassport): Promise<VendorPassport> {
  try {
    const { isHostedDatabaseUrl } = await import('@/lib/prisma');
    if (!isHostedDatabaseUrl()) return passport;

  const validation = validatePassport(passport);

  const row = await prisma.vendorPassport.upsert({
    where: { vendorEmail: passport.vendorEmail },
    create: {
      vendorEmail: passport.vendorEmail,
      businessName: passport.businessName,
      dba: passport.dba,
      contactName: passport.contactName,
      phone: passport.phone,
      website: passport.website,
      description: passport.description,
      categories: JSON.stringify(passport.categories),
      serviceTags: JSON.stringify(passport.serviceTags),
      validationState: validation.state,
      complianceScore: validation.score,
      insuranceExpiry: passport.insuranceExpiry ? new Date(passport.insuranceExpiry) : null,
      setupPhotoUrl: passport.setupPhotoUrl,
      vehicleType: passport.logistics.vehicleType,
      trailerLengthFt: passport.logistics.trailerLengthFt ?? null,
      boothWidthFt: passport.logistics.boothWidthFt ?? null,
      boothDepthFt: passport.logistics.boothDepthFt ?? null,
      needsElectric: passport.logistics.needsElectric,
      ampRequirement: passport.logistics.ampRequirement?.trim() || null,
      setupTimeMinutes: passport.logistics.setupTimeMinutes ?? null,
      waterAccess: passport.logistics.waterAccess ?? null,
      generatorOk: passport.logistics.generatorOk ?? null,
    },
    update: {
      businessName: passport.businessName,
      dba: passport.dba,
      contactName: passport.contactName,
      phone: passport.phone,
      website: passport.website,
      description: passport.description,
      categories: JSON.stringify(passport.categories),
      serviceTags: JSON.stringify(passport.serviceTags),
      validationState: validation.state,
      complianceScore: validation.score,
      insuranceExpiry: passport.insuranceExpiry ? new Date(passport.insuranceExpiry) : null,
      setupPhotoUrl: passport.setupPhotoUrl,
      vehicleType: passport.logistics.vehicleType,
      trailerLengthFt: passport.logistics.trailerLengthFt ?? null,
      boothWidthFt: passport.logistics.boothWidthFt ?? null,
      boothDepthFt: passport.logistics.boothDepthFt ?? null,
      needsElectric: passport.logistics.needsElectric,
      ampRequirement: passport.logistics.ampRequirement?.trim() || null,
      setupTimeMinutes: passport.logistics.setupTimeMinutes ?? null,
      waterAccess: passport.logistics.waterAccess ?? null,
      generatorOk: passport.logistics.generatorOk ?? null,
    },
    include: { documents: true },
  });

  await prisma.vendorDocument.deleteMany({ where: { passportId: row.id } });
  if (passport.documents.length > 0) {
    await prisma.vendorDocument.createMany({
      data: passport.documents.map(d => ({
        id: d.id,
        passportId: row.id,
        type: d.type,
        fileName: d.fileName,
        status: 'approved',
        uploadedAt: new Date(d.uploadedAt),
      })),
    });
  }

  const refreshed = await prisma.vendorPassport.findUniqueOrThrow({
    where: { id: row.id },
    include: { documents: true },
  });
  return prismaRowToPassport(refreshed);
  } catch {
    return passport;
  }
}
