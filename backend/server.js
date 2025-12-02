const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());

// DIRECT CONNECTION TO CLOUD DATABASE
const mongoUrl = 'mongodb+srv://jayaramr200_db_user:ChickenShop2025@cluster0.pzw4lxd.mongodb.net/sundays_chicken?appName=Cluster0';

console.log("Attempting to connect to database...");

mongoose.connect(mongoUrl)
  .then(() => console.log('✅ Connected to MongoDB successfully'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1); // Stop the server if DB fails
  });

// Data Structure
const RecordSchema = new mongoose.Schema({
  weekDate: String,
  createdAt: String,
  salesCompletedAt: String,
  totalHens: Number,
  totalLiveWeight: Number,
  purchaseRate: Number,
  totalPurchaseCost: Number,
  isSalesEntryComplete: Boolean,
  sellingPrice: Number,
  cashCollected: Number,
  upiCollected: Number,
  expenseTea: Number,
  expenseFuel: Number,
  totalExpenses: Number,
  totalRevenue: Number,
  meatSold: Number,
  wastage: Number,
  wastagePercentage: Number,
  netProfit: Number,
  profitPerHen: Number,
  profitPerKg: Number
});

// Handle the "_id" conversion for frontend
RecordSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
      ret.id = ret._id;
      delete ret._id;
  }
});

const RecordModel = mongoose.model('WeeklyRecord', RecordSchema);

// Routes
app.get('/records', async (req, res) => {
  try {
    const records = await RecordModel.find().sort({ weekDate: -1 });
    res.json(records);
  } catch(e) { res.status(500).json({error: e.message}) }
});

app.get('/records/:id', async (req, res) => {
  try {
    const record = await RecordModel.findById(req.params.id);
    res.json(record);
  } catch(e) { res.status(404).json({error: "Not found"}) }
});

app.post('/records', async (req, res) => {
  try {
    const newRecord = new RecordModel(req.body);
    const saved = await newRecord.save();
    res.json(saved);
  } catch(e) { res.status(500).json({error: e.message}) }
});

app.put('/records/:id', async (req, res) => {
  try {
    const updated = await RecordModel.findByIdAndUpdate(req.params.id, req.body, {new: true});
    res.json(updated);
  } catch(e) { res.status(500).json({error: e.message}) }
});

app.delete('/records/:id', async (req, res) => {
  await RecordModel.findByIdAndDelete(req.params.id);
  res.json({message: "Deleted"});
});

app.listen(PORT, () => console.log(`🚀 Backend running on port ${PORT}`));