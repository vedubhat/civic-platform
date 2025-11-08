import Officer from "../models/officerModel.js";
// import User from "../models/userModel.js";
// import Ward from "../models/wardModel.js";

/**
 * @desc    Create a new Officer record
 * @route   POST /api/officers/create
 * @access  Admin/System
 */
export const createOfficer = async (req, res) => {
  try {
    const { name , password , email } = req.body;

    // 3️⃣ Optional: validate wards
    // if (wardsManaged && wardsManaged.length > 0) {
    //   for (const wardId of wardsManaged) {
    //     const ward = await Ward.findById(wardId);
    //     if (!ward) {
    //       return res
    //         .status(404)
    //         .json({ message: `Ward not found with ID: ${wardId}` });
    //     }
    //   }
    // }

    // 4️⃣ Create officer
    const officer = await Officer.create({
      email,
      password,
      name
    });

    // 5️⃣ Send success response
    res.status(201).json({
      message: "Officer created successfully",
      officer,
    });
  } catch (error) {
    console.error("❌ Error creating officer:", error);
    res.status(500).json({ message: error.message });
  }
};
