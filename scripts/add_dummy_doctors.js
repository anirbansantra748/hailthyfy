const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const User = require('../models/User');
const Doctor = require('../models/Doctor');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const dummyDoctors = [
  {
    user: {
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@healthcare.com",
      password: "Doctor123!",
      isDoctor: true
    },
    doctor: {
      fullName: "Dr. Sarah Johnson",
      specialization: "Cardiology",
      subSpecializations: ["Interventional Cardiology", "Heart Failure", "Arrhythmias"],
      qualifications: [
        { degree: "MD", university: "Harvard Medical School", year: 2010 },
        { degree: "Fellowship in Cardiology", university: "Johns Hopkins Hospital", year: 2014 }
      ],
      licenseNumber: "MD-CARD-001",
      licenseVerificationStatus: "verified",
      experienceYears: 14,
      languages: ["English", "Spanish"],
      consultationFee: 250,
      consultationMode: ["online", "offline"],
      hospitalAffiliations: ["Mass General Hospital", "Brigham and Women's Hospital"],
      achievements: ["Best Cardiologist Award 2022", "Published 45+ Research Papers"],
      researchPapers: [
        { title: "Novel Approaches in Heart Failure Management", journal: "Journal of Cardiology", year: 2023, link: "#" },
        { title: "Minimally Invasive Cardiac Procedures", journal: "Heart Surgery Today", year: 2022, link: "#" }
      ],
      totalPatientsTreated: 2850,
      averageRating: 4.8,
      availability: [
        { day: "Monday", slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }] },
        { day: "Tuesday", slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }] },
        { day: "Wednesday", slots: [{ start: "09:00", end: "12:00" }] },
        { day: "Thursday", slots: [{ start: "09:00", end: "12:00" }, { start: "14:00", end: "17:00" }] },
        { day: "Friday", slots: [{ start: "09:00", end: "12:00" }] }
      ]
    }
  },
  {
    user: {
      name: "Dr. Michael Chen",
      email: "michael.chen@healthcare.com",
      password: "Doctor123!",
      isDoctor: true,
    },
    doctor: {
      fullName: "Dr. Michael Chen",
      specialization: "Neurology",
      subSpecializations: ["Stroke Medicine", "Epilepsy", "Movement Disorders"],
      qualifications: [
        { degree: "MD", university: "Stanford University", year: 2008 },
        { degree: "Neurology Residency", university: "UCSF Medical Center", year: 2012 },
        { degree: "Fellowship in Stroke Medicine", university: "Mayo Clinic", year: 2013 }
      ],
      licenseNumber: "MD-NEURO-002",
      licenseVerificationStatus: "verified",
      experienceYears: 16,
      languages: ["English", "Mandarin", "Cantonese"],
      consultationFee: 300,
      consultationMode: ["online", "offline", "home_visit"],
      hospitalAffiliations: ["Stanford Hospital", "UCSF Medical Center"],
      achievements: ["Top Neurologist 2023", "Research Excellence Award"],
      researchPapers: [
        { title: "Advanced Stroke Treatment Protocols", journal: "Neurology Today", year: 2023, link: "#" },
        { title: "Epilepsy Management in Modern Medicine", journal: "Brain Research", year: 2022, link: "#" }
      ],
      totalPatientsTreated: 3200,
      averageRating: 4.9,
      availability: [
        { day: "Monday", slots: [{ start: "08:00", end: "12:00" }, { start: "13:00", end: "18:00" }] },
        { day: "Tuesday", slots: [{ start: "08:00", end: "12:00" }, { start: "13:00", end: "18:00" }] },
        { day: "Wednesday", slots: [{ start: "08:00", end: "12:00" }, { start: "13:00", end: "16:00" }] },
        { day: "Thursday", slots: [{ start: "08:00", end: "12:00" }, { start: "13:00", end: "18:00" }] }
      ]
    }
  },
  {
    user: {
      name: "Dr. Emily Rodriguez",
      email: "emily.rodriguez@healthcare.com",
      password: "Doctor123!",
      isDoctor: true,
    },
    doctor: {
      fullName: "Dr. Emily Rodriguez",
      specialization: "Pediatrics",
      subSpecializations: ["Pediatric Endocrinology", "Child Development", "Adolescent Medicine"],
      qualifications: [
        { degree: "MD", university: "UCLA Medical School", year: 2011 },
        { degree: "Pediatrics Residency", university: "Children's Hospital LA", year: 2014 },
        { degree: "Fellowship in Pediatric Endocrinology", university: "Boston Children's Hospital", year: 2015 }
      ],
      licenseNumber: "MD-PEDS-003",
      licenseVerificationStatus: "verified",
      experienceYears: 13,
      languages: ["English", "Spanish", "Portuguese"],
      consultationFee: 200,
      consultationMode: ["online", "offline"],
      hospitalAffiliations: ["Children's Hospital LA", "UCLA Medical Center"],
      achievements: ["Pediatrician of the Year 2022", "Community Service Award"],
      researchPapers: [
        { title: "Childhood Obesity Prevention Strategies", journal: "Pediatric Medicine", year: 2023, link: "#" },
        { title: "Early Intervention in Developmental Delays", journal: "Child Development Today", year: 2022, link: "#" }
      ],
      totalPatientsTreated: 4500,
      averageRating: 4.7,
      availability: [
        { day: "Monday", slots: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "18:00" }] },
        { day: "Tuesday", slots: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "18:00" }] },
        { day: "Wednesday", slots: [{ start: "09:00", end: "13:00" }] },
        { day: "Thursday", slots: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "18:00" }] },
        { day: "Friday", slots: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "17:00" }] },
        { day: "Saturday", slots: [{ start: "09:00", end: "12:00" }] }
      ]
    }
  },
  {
    user: {
      name: "Dr. James Wilson",
      email: "james.wilson@healthcare.com",
      password: "Doctor123!",
      isDoctor: true,
    },
    doctor: {
      fullName: "Dr. James Wilson",
      specialization: "Orthopedic Surgery",
      subSpecializations: ["Sports Medicine", "Joint Replacement", "Trauma Surgery"],
      qualifications: [
        { degree: "MD", university: "Johns Hopkins University", year: 2009 },
        { degree: "Orthopedic Surgery Residency", university: "Hospital for Special Surgery", year: 2014 },
        { degree: "Fellowship in Sports Medicine", university: "Andrews Institute", year: 2015 }
      ],
      licenseNumber: "MD-ORTHO-004",
      licenseVerificationStatus: "verified",
      experienceYears: 15,
      languages: ["English", "French"],
      consultationFee: 350,
      consultationMode: ["offline", "online"],
      hospitalAffiliations: ["Hospital for Special Surgery", "Mount Sinai Hospital"],
      achievements: ["Top Orthopedic Surgeon 2023", "Excellence in Sports Medicine"],
      researchPapers: [
        { title: "Minimally Invasive Knee Replacement Techniques", journal: "Orthopedic Surgery Today", year: 2023, link: "#" },
        { title: "Sports Injury Prevention and Recovery", journal: "Sports Medicine Journal", year: 2022, link: "#" }
      ],
      totalPatientsTreated: 1850,
      averageRating: 4.8,
      availability: [
        { day: "Monday", slots: [{ start: "07:00", end: "12:00" }, { start: "13:00", end: "17:00" }] },
        { day: "Tuesday", slots: [{ start: "07:00", end: "12:00" }, { start: "13:00", end: "17:00" }] },
        { day: "Wednesday", slots: [{ start: "07:00", end: "12:00" }] },
        { day: "Thursday", slots: [{ start: "07:00", end: "12:00" }, { start: "13:00", end: "17:00" }] }
      ]
    }
  },
  {
    user: {
      name: "Dr. Priya Patel",
      email: "priya.patel@healthcare.com",
      password: "Doctor123!",
      isDoctor: true,
    },
    doctor: {
      fullName: "Dr. Priya Patel",
      specialization: "Dermatology",
      subSpecializations: ["Cosmetic Dermatology", "Pediatric Dermatology", "Dermatopathology"],
      qualifications: [
        { degree: "MD", university: "University of Pennsylvania", year: 2012 },
        { degree: "Dermatology Residency", university: "NYU Langone Health", year: 2016 },
        { degree: "Fellowship in Mohs Surgery", university: "Memorial Sloan Kettering", year: 2017 }
      ],
      licenseNumber: "MD-DERM-005",
      licenseVerificationStatus: "verified",
      experienceYears: 12,
      languages: ["English", "Hindi", "Gujarati"],
      consultationFee: 275,
      consultationMode: ["online", "offline"],
      hospitalAffiliations: ["NYU Langone Health", "Mount Sinai Dermatology"],
      achievements: ["Best Dermatologist NYC 2022", "Patient Choice Award"],
      researchPapers: [
        { title: "Advanced Techniques in Mohs Surgery", journal: "Dermatologic Surgery", year: 2023, link: "#" },
        { title: "Pediatric Skin Conditions: Modern Approaches", journal: "Journal of Dermatology", year: 2022, link: "#" }
      ],
      totalPatientsTreated: 3800,
      averageRating: 4.6,
      availability: [
        { day: "Monday", slots: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "18:00" }] },
        { day: "Tuesday", slots: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "18:00" }] },
        { day: "Thursday", slots: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "18:00" }] },
        { day: "Friday", slots: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "17:00" }] }
      ]
    }
  },
  {
    user: {
      name: "Dr. Robert Thompson",
      email: "robert.thompson@healthcare.com",
      password: "Doctor123!",
      isDoctor: true,
    },
    doctor: {
      fullName: "Dr. Robert Thompson",
      specialization: "Internal Medicine",
      subSpecializations: ["Preventive Medicine", "Geriatric Medicine", "Chronic Disease Management"],
      qualifications: [
        { degree: "MD", university: "University of Chicago", year: 2006 },
        { degree: "Internal Medicine Residency", university: "Northwestern Memorial", year: 2009 },
        { degree: "Fellowship in Geriatric Medicine", university: "Mayo Clinic", year: 2010 }
      ],
      licenseNumber: "MD-IM-006",
      licenseVerificationStatus: "verified",
      experienceYears: 18,
      languages: ["English", "German"],
      consultationFee: 180,
      consultationMode: ["online", "offline", "home_visit"],
      hospitalAffiliations: ["Northwestern Memorial", "Rush University Medical Center"],
      achievements: ["Excellence in Patient Care 2023", "Lifetime Achievement Award"],
      researchPapers: [
        { title: "Preventive Care in Aging Populations", journal: "Internal Medicine Today", year: 2023, link: "#" },
        { title: "Managing Multiple Chronic Conditions", journal: "Primary Care Medicine", year: 2022, link: "#" }
      ],
      totalPatientsTreated: 5200,
      averageRating: 4.7,
      availability: [
        { day: "Monday", slots: [{ start: "08:00", end: "12:00" }, { start: "13:00", end: "17:00" }] },
        { day: "Tuesday", slots: [{ start: "08:00", end: "12:00" }, { start: "13:00", end: "17:00" }] },
        { day: "Wednesday", slots: [{ start: "08:00", end: "12:00" }, { start: "13:00", end: "17:00" }] },
        { day: "Thursday", slots: [{ start: "08:00", end: "12:00" }, { start: "13:00", end: "17:00" }] },
        { day: "Friday", slots: [{ start: "08:00", end: "12:00" }] }
      ]
    }
  },
  {
    user: {
      name: "Dr. Lisa Chang",
      email: "lisa.chang@healthcare.com",
      password: "Doctor123!",
      isDoctor: true,
    },
    doctor: {
      fullName: "Dr. Lisa Chang",
      specialization: "Obstetrics and Gynecology",
      subSpecializations: ["High-Risk Pregnancy", "Minimally Invasive Surgery", "Reproductive Endocrinology"],
      qualifications: [
        { degree: "MD", university: "Columbia University", year: 2010 },
        { degree: "OB/GYN Residency", university: "NewYork-Presbyterian", year: 2014 },
        { degree: "Fellowship in Maternal-Fetal Medicine", university: "Yale School of Medicine", year: 2015 }
      ],
      licenseNumber: "MD-OBGYN-007",
      licenseVerificationStatus: "verified",
      experienceYears: 14,
      languages: ["English", "Mandarin", "Korean"],
      consultationFee: 225,
      consultationMode: ["online", "offline"],
      hospitalAffiliations: ["NewYork-Presbyterian", "Columbia University Irving Medical Center"],
      achievements: ["Top OB/GYN 2022", "Women's Health Champion Award"],
      researchPapers: [
        { title: "Advances in High-Risk Pregnancy Management", journal: "Obstetrics & Gynecology", year: 2023, link: "#" },
        { title: "Minimally Invasive Surgical Techniques", journal: "Gynecologic Surgery", year: 2022, link: "#" }
      ],
      totalPatientsTreated: 2400,
      averageRating: 4.8,
      availability: [
        { day: "Monday", slots: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "18:00" }] },
        { day: "Tuesday", slots: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "18:00" }] },
        { day: "Wednesday", slots: [{ start: "09:00", end: "13:00" }] },
        { day: "Friday", slots: [{ start: "09:00", end: "13:00" }, { start: "14:00", end: "17:00" }] }
      ]
    }
  },
  {
    user: {
      name: "Dr. David Kumar",
      email: "david.kumar@healthcare.com",
      password: "Doctor123!",
      isDoctor: true,
    },
    doctor: {
      fullName: "Dr. David Kumar",
      specialization: "Psychiatry",
      subSpecializations: ["Adult Psychiatry", "Anxiety Disorders", "Depression Treatment"],
      qualifications: [
        { degree: "MD", university: "University of Michigan", year: 2009 },
        { degree: "Psychiatry Residency", university: "McLean Hospital", year: 2013 },
        { degree: "Fellowship in Anxiety Disorders", university: "Mass General Brigham", year: 2014 }
      ],
      licenseNumber: "MD-PSYCH-008",
      licenseVerificationStatus: "verified",
      experienceYears: 15,
      languages: ["English", "Hindi", "Tamil"],
      consultationFee: 200,
      consultationMode: ["online", "offline"],
      hospitalAffiliations: ["McLean Hospital", "Brigham and Women's Hospital"],
      achievements: ["Excellence in Mental Health Care 2023", "Community Impact Award"],
      researchPapers: [
        { title: "Novel Approaches to Anxiety Treatment", journal: "Journal of Psychiatry", year: 2023, link: "#" },
        { title: "Digital Mental Health Interventions", journal: "Psychiatric Services", year: 2022, link: "#" }
      ],
      totalPatientsTreated: 1650,
      averageRating: 4.9,
      availability: [
        { day: "Monday", slots: [{ start: "10:00", end: "14:00" }, { start: "15:00", end: "19:00" }] },
        { day: "Tuesday", slots: [{ start: "10:00", end: "14:00" }, { start: "15:00", end: "19:00" }] },
        { day: "Wednesday", slots: [{ start: "10:00", end: "14:00" }, { start: "15:00", end: "18:00" }] },
        { day: "Thursday", slots: [{ start: "10:00", end: "14:00" }, { start: "15:00", end: "19:00" }] },
        { day: "Friday", slots: [{ start: "10:00", end: "14:00" }] }
      ]
    }
  },
  {
    user: {
      name: "Dr. Amanda Foster",
      email: "amanda.foster@healthcare.com",
      password: "Doctor123!",
      isDoctor: true,
    },
    doctor: {
      fullName: "Dr. Amanda Foster",
      specialization: "Emergency Medicine",
      subSpecializations: ["Trauma Care", "Critical Care", "Emergency Pediatrics"],
      qualifications: [
        { degree: "MD", university: "University of Washington", year: 2011 },
        { degree: "Emergency Medicine Residency", university: "Harborview Medical Center", year: 2015 },
        { degree: "Fellowship in Emergency Critical Care", university: "University of Pittsburgh", year: 2016 }
      ],
      licenseNumber: "MD-EM-009",
      licenseVerificationStatus: "verified",
      experienceYears: 13,
      languages: ["English", "Spanish"],
      consultationFee: 300,
      consultationMode: ["online", "offline"],
      hospitalAffiliations: ["Harborview Medical Center", "Seattle Children's Hospital"],
      achievements: ["Emergency Physician of the Year 2022", "Trauma Care Excellence Award"],
      researchPapers: [
        { title: "Rapid Trauma Assessment Protocols", journal: "Emergency Medicine Today", year: 2023, link: "#" },
        { title: "Pediatric Emergency Care Best Practices", journal: "Emergency Pediatrics", year: 2022, link: "#" }
      ],
      totalPatientsTreated: 8500,
      averageRating: 4.7,
      availability: [
        { day: "Monday", slots: [{ start: "06:00", end: "14:00" }] },
        { day: "Tuesday", slots: [{ start: "06:00", end: "14:00" }] },
        { day: "Wednesday", slots: [{ start: "14:00", end: "22:00" }] },
        { day: "Thursday", slots: [{ start: "14:00", end: "22:00" }] },
        { day: "Friday", slots: [{ start: "06:00", end: "14:00" }] }
      ]
    }
  },
  {
    user: {
      name: "Dr. Marcus Williams",
      email: "marcus.williams@healthcare.com",
      password: "Doctor123!",
      isDoctor: true,
    },
    doctor: {
      fullName: "Dr. Marcus Williams",
      specialization: "Oncology",
      subSpecializations: ["Medical Oncology", "Hematology", "Cancer Research"],
      qualifications: [
        { degree: "MD", university: "Duke University", year: 2008 },
        { degree: "Internal Medicine Residency", university: "Duke University Hospital", year: 2011 },
        { degree: "Fellowship in Hematology-Oncology", university: "MD Anderson Cancer Center", year: 2014 }
      ],
      licenseNumber: "MD-ONCO-010",
      licenseVerificationStatus: "verified",
      experienceYears: 16,
      languages: ["English", "French"],
      consultationFee: 400,
      consultationMode: ["online", "offline"],
      hospitalAffiliations: ["MD Anderson Cancer Center", "Duke University Hospital"],
      achievements: ["Top Oncologist 2023", "Excellence in Cancer Research", "Humanitarian Award"],
      researchPapers: [
        { title: "Breakthrough Cancer Immunotherapy", journal: "Nature Oncology", year: 2023, link: "#" },
        { title: "Precision Medicine in Hematologic Malignancies", journal: "Blood Cancer Research", year: 2022, link: "#" },
        { title: "Novel Targeted Therapies", journal: "Cancer Treatment Reviews", year: 2022, link: "#" }
      ],
      totalPatientsTreated: 1200,
      averageRating: 4.9,
      availability: [
        { day: "Monday", slots: [{ start: "08:00", end: "12:00" }, { start: "13:00", end: "17:00" }] },
        { day: "Tuesday", slots: [{ start: "08:00", end: "12:00" }, { start: "13:00", end: "17:00" }] },
        { day: "Wednesday", slots: [{ start: "08:00", end: "12:00" }] },
        { day: "Thursday", slots: [{ start: "08:00", end: "12:00" }, { start: "13:00", end: "17:00" }] }
      ]
    }
  }
];

async function addDummyDoctors() {
  try {
    console.log('Starting to add dummy doctors...');
    
    for (let i = 0; i < dummyDoctors.length; i++) {
      const doctorData = dummyDoctors[i];
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: doctorData.user.email });
      if (existingUser) {
        console.log(`User ${doctorData.user.email} already exists, skipping...`);
        continue;
      }
      
      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(doctorData.user.password, saltRounds);
      
      // Create user
      const user = new User({
        ...doctorData.user,
        password: hashedPassword
      });
      
      await user.save();
      console.log(`Created user: ${user.email}`);
      
      // Create doctor profile
      const doctor = new Doctor({
        ...doctorData.doctor,
        user: user._id
      });
      
      await doctor.save();
      console.log(`Created doctor profile: ${doctor.fullName}`);
      
      // Add some dummy reviews
      const reviews = [];
      const reviewCount = Math.floor(Math.random() * 8) + 3; // 3-10 reviews
      
      for (let j = 0; j < reviewCount; j++) {
        const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars mostly
        const comments = [
          "Excellent doctor with great bedside manner. Highly recommend!",
          "Very professional and knowledgeable. Helped me understand my condition clearly.",
          "Outstanding care and attention to detail. Thank you!",
          "Dr. was thorough and took time to answer all my questions.",
          "Great experience overall. The doctor was very helpful and patient.",
          "Professional service and accurate diagnosis. Very satisfied.",
          "Highly skilled and compassionate. Made me feel comfortable throughout.",
          "Quick and efficient consultation. Got exactly what I needed."
        ];
        
        reviews.push({
          rating: rating,
          comment: comments[Math.floor(Math.random() * comments.length)],
          createdAt: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)) // Random date within last year
        });
      }
      
      doctor.reviews = reviews;
      await doctor.save();
      console.log(`Added ${reviews.length} reviews for ${doctor.fullName}`);
    }
    
    console.log('✅ All dummy doctors added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding dummy doctors:', error);
    process.exit(1);
  }
}

// Run the script
addDummyDoctors();