import mongoose from 'mongoose';
import mongooseSequence from 'mongoose-sequence';

const AutoIncrement = mongooseSequence(mongoose);

const invoiceSchema = new mongoose.Schema({
  // Invoice identification
  number: {
    type: String,
    unique: true,
    required: true
  },
  
  sequentialNumber: Number, // Auto-incremented
  
  series: {
    type: String,
    default: 'FAC',
    uppercase: true
  },
  
  type: {
    type: String,
    enum: ['invoice', 'credit_note', 'debit_note', 'proforma', 'recurring'],
    default: 'invoice'
  },
  
  // Related entities
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  customer: {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    name: { type: String, required: true },
    taxId: { type: String, required: true },
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: 'ES' }
    }
  },
  
  // Invoice details
  issueDate: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  dueDate: {
    type: Date,
    required: true
  },
  
  paymentTerms: {
    type: String,
    enum: ['immediate', '15_days', '30_days', '45_days', '60_days', '90_days', 'custom'],
    default: '30_days'
  },
  
  // Line items
  items: [{
    product: {
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      name: { type: String, required: true },
      sku: String
    },
    description: String,
    quantity: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      default: 'unit'
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    tax: {
      rate: { type: Number, required: true },
      type: { type: String, enum: ['IVA', 'IRPF', 'RE'], default: 'IVA' }
    },
    subtotal: Number,
    total: Number
  }],
  
  // Financial summary
  financial: {
    subtotal: { type: Number, required: true },
    totalDiscount: { type: Number, default: 0 },
    taxBase: { type: Number, required: true },
    taxes: [{
      type: { type: String, enum: ['IVA', 'IRPF', 'RE'] },
      rate: Number,
      base: Number,
      amount: Number
    }],
    totalTax: { type: Number, required: true },
    total: { type: Number, required: true },
    totalInWords: String
  },
  
  // Payment information
  payment: {
    method: {
      type: String,
      enum: ['cash', 'transfer', 'card', 'paypal', 'stripe', 'direct_debit', 'check', 'other'],
      default: 'transfer'
    },
    status: {
      type: String,
      enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'],
      default: 'pending'
    },
    paidAmount: { type: Number, default: 0 },
    payments: [{
      date: Date,
      amount: Number,
      method: String,
      reference: String,
      notes: String
    }],
    bankAccount: {
      iban: String,
      swift: String,
      bankName: String
    }
  },
  
  // Legal compliance
  legal: {
    // Electronic invoice compliance
    sii: {
      enabled: { type: Boolean, default: false },
      status: { type: String, enum: ['pending', 'sent', 'accepted', 'rejected'] },
      csv: String,
      sentDate: Date,
      response: mongoose.Schema.Types.Mixed
    },
    
    verifactu: {
      enabled: { type: Boolean, default: false },
      qrCode: String,
      hash: String
    },
    
    ticketBai: {
      enabled: { type: Boolean, default: false },
      identifier: String,
      qrCode: String
    }
  },
  
  // Document management
  documents: {
    pdf: {
      url: String,
      generatedAt: Date
    },
    xml: {
      url: String,
      generatedAt: Date
    },
    signed: {
      url: String,
      signedAt: Date,
      signedBy: String
    }
  },
  
  // Additional information
  notes: String,
  internalNotes: String,
  
  tags: [String],
  
  template: {
    type: String,
    default: 'default'
  },
  
  customFields: [{
    name: String,
    value: mongoose.Schema.Types.Mixed
  }],
  
  // Recurring invoice settings
  recurring: {
    enabled: { type: Boolean, default: false },
    frequency: {
      type: String,
      enum: ['weekly', 'monthly', 'quarterly', 'yearly']
    },
    nextDate: Date,
    endDate: Date,
    occurrences: Number
  },
  
  // Audit trail
  history: [{
    action: String,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
    details: mongoose.Schema.Types.Mixed
  }],
  
  // Metadata
  metadata: {
    source: {
      type: String,
      enum: ['manual', 'api', 'import', 'recurring'],
      default: 'manual'
    },
    ip: String,
    userAgent: String
  },
  
  isDeleted: {
    type: Boolean,
    default: false
  },
  
  deletedAt: Date
}, {
  timestamps: true
});

// Auto-increment sequential number
invoiceSchema.plugin(AutoIncrement, {
  inc_field: 'sequentialNumber',
  start_seq: 1
});

// Indexes
invoiceSchema.index({ number: 1 });
invoiceSchema.index({ user: 1, issueDate: -1 });
invoiceSchema.index({ 'customer.customerId': 1 });
invoiceSchema.index({ 'payment.status': 1 });
invoiceSchema.index({ type: 1 });
invoiceSchema.index({ series: 1, sequentialNumber: 1 });

// Generate invoice number
invoiceSchema.pre('save', function(next) {
  if (this.isNew && !this.number) {
    const year = new Date().getFullYear();
    this.number = `${this.series}${year}-${String(this.sequentialNumber).padStart(5, '0')}`;
  }
  next();
});

// Calculate financial totals
invoiceSchema.pre('save', function(next) {
  let subtotal = 0;
  let totalDiscount = 0;
  const taxGroups = {};
  
  // Calculate line items
  this.items.forEach(item => {
    const lineSubtotal = item.quantity * item.unitPrice;
    const discountAmount = lineSubtotal * (item.discount / 100);
    const lineTotal = lineSubtotal - discountAmount;
    
    item.subtotal = lineSubtotal;
    item.total = lineTotal;
    
    subtotal += lineSubtotal;
    totalDiscount += discountAmount;
    
    // Group taxes
    const taxKey = `${item.tax.type}-${item.tax.rate}`;
    if (!taxGroups[taxKey]) {
      taxGroups[taxKey] = {
        type: item.tax.type,
        rate: item.tax.rate,
        base: 0,
        amount: 0
      };
    }
    taxGroups[taxKey].base += lineTotal;
    taxGroups[taxKey].amount += lineTotal * (item.tax.rate / 100);
  });
  
  // Set financial summary
  this.financial.subtotal = subtotal;
  this.financial.totalDiscount = totalDiscount;
  this.financial.taxBase = subtotal - totalDiscount;
  this.financial.taxes = Object.values(taxGroups);
  this.financial.totalTax = this.financial.taxes.reduce((sum, tax) => sum + tax.amount, 0);
  this.financial.total = this.financial.taxBase + this.financial.totalTax;
  
  next();
});

// Methods
invoiceSchema.methods = {
  // Mark as paid
  markAsPaid(paymentInfo) {
    this.payment.status = 'paid';
    this.payment.paidAmount = this.financial.total;
    this.payment.payments.push({
      date: new Date(),
      amount: this.financial.total,
      ...paymentInfo
    });
    return this.save();
  },
  
  // Add payment
  addPayment(paymentData) {
    this.payment.payments.push(paymentData);
    this.payment.paidAmount = this.payment.payments.reduce((sum, p) => sum + p.amount, 0);
    
    if (this.payment.paidAmount >= this.financial.total) {
      this.payment.status = 'paid';
    } else if (this.payment.paidAmount > 0) {
      this.payment.status = 'partial';
    }
    
    return this.save();
  },
  
  // Check if overdue
  isOverdue() {
    return this.payment.status === 'pending' && 
           this.dueDate < new Date();
  },
  
  // Clone invoice
  clone() {
    const cloned = this.toObject();
    delete cloned._id;
    delete cloned.number;
    delete cloned.sequentialNumber;
    delete cloned.createdAt;
    delete cloned.updatedAt;
    cloned.issueDate = new Date();
    cloned.payment = {
      method: this.payment.method,
      status: 'pending',
      paidAmount: 0,
      payments: []
    };
    return new Invoice(cloned);
  }
};

// Statics
invoiceSchema.statics = {
  // Get next invoice number
  async getNextNumber(series = 'FAC') {
    const lastInvoice = await this.findOne({ series })
      .sort({ sequentialNumber: -1 })
      .select('sequentialNumber');
    
    const nextNumber = lastInvoice ? lastInvoice.sequentialNumber + 1 : 1;
    const year = new Date().getFullYear();
    
    return `${series}${year}-${String(nextNumber).padStart(5, '0')}`;
  },
  
  // Get statistics
  async getStatistics(userId, dateRange) {
    const match = { user: userId };
    if (dateRange) {
      match.issueDate = {
        $gte: dateRange.start,
        $lte: dateRange.end
      };
    }
    
    const stats = await this.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: '$financial.total' },
          paidAmount: { $sum: '$payment.paidAmount' },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ['$payment.status', 'pending'] },
                '$financial.total',
                0
              ]
            }
          },
          overdueAmount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ['$payment.status', 'pending'] },
                    { $lt: ['$dueDate', new Date()] }
                  ]
                },
                '$financial.total',
                0
              ]
            }
          }
        }
      }
    ]);
    
    return stats[0] || {
      totalInvoices: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0,
      overdueAmount: 0
    };
  }
};

const Invoice = mongoose.model('Invoice', invoiceSchema);

export default Invoice;