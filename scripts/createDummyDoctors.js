const mongoose = require("mongoose");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
require("dotenv").config();

// Connect to MongoDB
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/healthfy",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const dummyDoctors = [
  {
    fullName: "Dr. Sarah Johnson",
    gender: "female",
    specialization: "Cardiologist",
    subSpecializations: ["Interventional Cardiology", "Heart Failure"],
    experienceYears: 15,
    licenseNumber: "MD12345",
    hospitalAffiliations: ["Johns Hopkins Hospital", "Mayo Clinic"],
    languages: ["English", "Spanish"],
    consultationMode: ["online", "offline"],
    consultationFee: 200,
    currency: "USD",
    availability: [
      { day: "Monday", slots: [{ start: "09:00", end: "17:00" }] },
      { day: "Tuesday", slots: [{ start: "09:00", end: "17:00" }] },
      { day: "Wednesday", slots: [{ start: "09:00", end: "17:00" }] },
      { day: "Thursday", slots: [{ start: "09:00", end: "17:00" }] },
      { day: "Friday", slots: [{ start: "09:00", end: "17:00" }] },
    ],
    qualifications: [
      { degree: "MD", university: "Harvard Medical School", year: 2008 },
      { degree: "Fellowship", university: "Stanford University", year: 2012 },
    ],
    achievements: [
      "Board Certified Cardiologist",
      "Top Doctor 2023",
      "Research Excellence Award",
    ],
    researchPapers: [
      {
        title: "Advances in Heart Failure Treatment",
        journal: "New England Journal of Medicine",
        year: 2022,
        link: "https://example.com/paper1",
      },
      {
        title: "Cardiac Imaging Techniques",
        journal: "Journal of Cardiology",
        year: 2021,
        link: "https://example.com/paper2",
      },
    ],
    averageRating: 4.8,
    totalPatientsTreated: 2500,
    specializationScore: 95,
    popularityIndex: 92,
    documentsVerified: true,
    licenseVerificationStatus: "verified",
  },
  {
    fullName: "Dr. Michael Chen",
    gender: "male",
    specialization: "Neurologist",
    subSpecializations: ["Stroke Neurology", "Epilepsy"],
    experienceYears: 12,
    licenseNumber: "MD67890",
    hospitalAffiliations: [
      "Massachusetts General Hospital",
      "UCLA Medical Center",
    ],
    languages: ["English", "Mandarin"],
    consultationMode: ["online", "offline", "home_visit"],
    consultationFee: 180,
    currency: "USD",
    availability: [
      { day: "Monday", slots: [{ start: "08:00", end: "16:00" }] },
      { day: "Tuesday", slots: [{ start: "08:00", end: "16:00" }] },
      { day: "Wednesday", slots: [{ start: "08:00", end: "16:00" }] },
      { day: "Thursday", slots: [{ start: "08:00", end: "16:00" }] },
      { day: "Friday", slots: [{ start: "08:00", end: "16:00" }] },
    ],
    qualifications: [
      { degree: "MD", university: "UCLA School of Medicine", year: 2011 },
      { degree: "PhD", university: "Stanford University", year: 2015 },
    ],
    achievements: [
      "Board Certified Neurologist",
      "Stroke Specialist",
      "Epilepsy Research Award",
    ],
    researchPapers: [
      {
        title: "Stroke Prevention Strategies",
        journal: "Stroke",
        year: 2023,
        link: "https://example.com/paper3",
      },
      {
        title: "Epilepsy Management",
        journal: "Neurology",
        year: 2022,
        link: "https://example.com/paper4",
      },
    ],
    averageRating: 4.7,
    totalPatientsTreated: 1800,
    specializationScore: 93,
    popularityIndex: 88,
    documentsVerified: true,
    licenseVerificationStatus: "verified",
  },
  {
    fullName: "Dr. Emily Rodriguez",
    gender: "female",
    specialization: "Dermatologist",
    subSpecializations: ["Cosmetic Dermatology", "Skin Cancer"],
    experienceYears: 10,
    licenseNumber: "MD24680",
    hospitalAffiliations: ["Mount Sinai Hospital", "NYU Langone"],
    languages: ["English", "Spanish", "Portuguese"],
    consultationMode: ["online", "offline"],
    consultationFee: 150,
    currency: "USD",
    availability: [
      { day: "Monday", slots: [{ start: "10:00", end: "18:00" }] },
      { day: "Tuesday", slots: [{ start: "10:00", end: "18:00" }] },
      { day: "Wednesday", slots: [{ start: "10:00", end: "18:00" }] },
      { day: "Thursday", slots: [{ start: "10:00", end: "18:00" }] },
      { day: "Friday", slots: [{ start: "10:00", end: "18:00" }] },
      { day: "Saturday", slots: [{ start: "09:00", end: "15:00" }] },
    ],
    qualifications: [
      { degree: "MD", university: "Columbia University", year: 2013 },
      { degree: "Residency", university: "Yale University", year: 2017 },
    ],
    achievements: [
      "Board Certified Dermatologist",
      "Cosmetic Surgery Specialist",
      "Patient Choice Award",
    ],
    researchPapers: [
      {
        title: "Melanoma Detection",
        journal: "JAMA Dermatology",
        year: 2023,
        link: "https://example.com/paper5",
      },
      {
        title: "Anti-aging Treatments",
        journal: "Dermatologic Surgery",
        year: 2022,
        link: "https://example.com/paper6",
      },
    ],
    averageRating: 4.9,
    totalPatientsTreated: 3200,
    specializationScore: 91,
    popularityIndex: 95,
    documentsVerified: true,
    licenseVerificationStatus: "verified",
  },
  {
    fullName: "Dr. James Wilson",
    gender: "male",
    specialization: "Orthopedic Surgeon",
    subSpecializations: ["Joint Replacement", "Sports Medicine"],
    experienceYears: 18,
    licenseNumber: "MD13579",
    hospitalAffiliations: ["Hospital for Special Surgery", "Cleveland Clinic"],
    languages: ["English"],
    consultationMode: ["online", "offline"],
    consultationFee: 250,
    currency: "USD",
    availability: [
      { day: "Monday", slots: [{ start: "07:00", end: "15:00" }] },
      { day: "Tuesday", slots: [{ start: "07:00", end: "15:00" }] },
      { day: "Wednesday", slots: [{ start: "07:00", end: "15:00" }] },
      { day: "Thursday", slots: [{ start: "07:00", end: "15:00" }] },
      { day: "Friday", slots: [{ start: "07:00", end: "15:00" }] },
    ],
    qualifications: [
      { degree: "MD", university: "Johns Hopkins University", year: 2005 },
      {
        degree: "Fellowship",
        university: "Hospital for Special Surgery",
        year: 2010,
      },
    ],
    achievements: [
      "Board Certified Orthopedic Surgeon",
      "Sports Medicine Specialist",
      "Surgical Excellence Award",
    ],
    researchPapers: [
      {
        title: "Minimally Invasive Joint Replacement",
        journal: "Journal of Bone and Joint Surgery",
        year: 2023,
        link: "https://example.com/paper7",
      },
      {
        title: "Sports Injury Prevention",
        journal: "Sports Medicine",
        year: 2022,
        link: "https://example.com/paper8",
      },
    ],
    averageRating: 4.6,
    totalPatientsTreated: 4200,
    specializationScore: 96,
    popularityIndex: 85,
    documentsVerified: true,
    licenseVerificationStatus: "verified",
  },
  {
    fullName: "Dr. Lisa Thompson",
    gender: "female",
    specialization: "Pediatrician",
    subSpecializations: ["General Pediatrics", "Developmental Pediatrics"],
    experienceYears: 14,
    licenseNumber: "MD97531",
    hospitalAffiliations: [
      "Children's Hospital of Philadelphia",
      "Boston Children's Hospital",
    ],
    languages: ["English", "French"],
    consultationMode: ["online", "offline", "home_visit"],
    consultationFee: 120,
    currency: "USD",
    availability: [
      { day: "Monday", slots: [{ start: "08:00", end: "16:00" }] },
      { day: "Tuesday", slots: [{ start: "08:00", end: "16:00" }] },
      { day: "Wednesday", slots: [{ start: "08:00", end: "16:00" }] },
      { day: "Thursday", slots: [{ start: "08:00", end: "16:00" }] },
      { day: "Friday", slots: [{ start: "08:00", end: "16:00" }] },
      { day: "Saturday", slots: [{ start: "09:00", end: "14:00" }] },
    ],
    qualifications: [
      { degree: "MD", university: "University of Pennsylvania", year: 2009 },
      {
        degree: "Residency",
        university: "Children's Hospital of Philadelphia",
        year: 2012,
      },
    ],
    achievements: [
      "Board Certified Pediatrician",
      "Developmental Specialist",
      "Patient Care Excellence",
    ],
    researchPapers: [
      {
        title: "Child Development Milestones",
        journal: "Pediatrics",
        year: 2023,
        link: "https://example.com/paper9",
      },
      {
        title: "Vaccination Safety",
        journal: "Journal of Pediatrics",
        year: 2022,
        link: "https://example.com/paper10",
      },
    ],
    averageRating: 4.8,
    totalPatientsTreated: 2800,
    specializationScore: 94,
    popularityIndex: 90,
    documentsVerified: true,
    licenseVerificationStatus: "verified",
  },
  {
    fullName: "Dr. Robert Kim",
    gender: "male",
    specialization: "Psychiatrist",
    subSpecializations: ["Adult Psychiatry", "Addiction Medicine"],
    experienceYears: 16,
    licenseNumber: "MD86420",
    hospitalAffiliations: ["McLean Hospital", "Massachusetts General Hospital"],
    languages: ["English", "Korean"],
    consultationMode: ["online", "offline"],
    consultationFee: 200,
    currency: "USD",
    availability: [
      { day: "Monday", slots: [{ start: "09:00", end: "17:00" }] },
      { day: "Tuesday", slots: [{ start: "09:00", end: "17:00" }] },
      { day: "Wednesday", slots: [{ start: "09:00", end: "17:00" }] },
      { day: "Thursday", slots: [{ start: "09:00", end: "17:00" }] },
      { day: "Friday", slots: [{ start: "09:00", end: "17:00" }] },
    ],
    qualifications: [
      { degree: "MD", university: "Stanford University", year: 2007 },
      {
        degree: "Fellowship",
        university: "Harvard Medical School",
        year: 2011,
      },
    ],
    achievements: [
      "Board Certified Psychiatrist",
      "Addiction Medicine Specialist",
      "Mental Health Advocate",
    ],
    researchPapers: [
      {
        title: "Depression Treatment",
        journal: "American Journal of Psychiatry",
        year: 2023,
        link: "https://example.com/paper11",
      },
      {
        title: "Addiction Recovery",
        journal: "Journal of Addiction Medicine",
        year: 2022,
        link: "https://example.com/paper12",
      },
    ],
    averageRating: 4.7,
    totalPatientsTreated: 1900,
    specializationScore: 92,
    popularityIndex: 87,
    documentsVerified: true,
    licenseVerificationStatus: "verified",
  },
];

async function createDummyDoctors() {
  try {
    console.log("Starting to create dummy doctors...");

    // Clear existing doctors (optional)
    // await Doctor.deleteMany({});

    for (const doctorData of dummyDoctors) {
      // Check if doctor already exists
      const existingDoctor = await Doctor.findOne({
        licenseNumber: doctorData.licenseNumber,
      });

      if (existingDoctor) {
        console.log(
          `Doctor ${doctorData.fullName} already exists, skipping...`
        );
        continue;
      }

      // Create a dummy user for the doctor
      const dummyUser = new User({
        name: doctorData.fullName,
        email: `${doctorData.fullName
          .toLowerCase()
          .replace(/\s+/g, ".")}@healthfy.com`,
        password: "password123",
        role: "doctor",
        isDoctor: true,
        isVerified: true,
        emailVerified: true,
      });

      await dummyUser.save();
      console.log(`Created user for ${doctorData.fullName}`);

      // Create the doctor profile
      const doctor = new Doctor({
        ...doctorData,
        user: dummyUser._id,
      });

      await doctor.save();
      console.log(`Created doctor: ${doctorData.fullName}`);

      // Update user with doctor profile reference
      dummyUser.doctorProfile = doctor._id;
      await dummyUser.save();
    }

    console.log("All dummy doctors created successfully!");

    // Display summary
    const totalDoctors = await Doctor.countDocuments();
    console.log(`Total doctors in database: ${totalDoctors}`);
  } catch (error) {
    console.error("Error creating dummy doctors:", error);
  } finally {
    mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the script
createDummyDoctors();
