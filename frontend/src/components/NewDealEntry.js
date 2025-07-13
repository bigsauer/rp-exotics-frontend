import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, ArrowLeft, Save, Send, AlertCircle, CheckCircle, Loader2, 
  Calendar, DollarSign, FileText, User, 
  MapPin, Phone, Mail, Hash, Palette, Key, Gauge, 
  Info, Shield, Clock, Plus, X, Home
} from 'lucide-react';
import ApiService from '../services/api';

const NewDealEntry = () => {
  const navigate = useNavigate();
  
  const [currentUser] = useState({
    name: 'Chris Murphy',
    role: 'admin',
    permissions: {
      canCreateDeals: true,
      canViewFinancials: true,
      canManageDealers: true
    }
  });

  const [formData, setFormData] = useState({
    // Vehicle Information
    vin: '',
    year: '',
    make: '',
    model: '',
    mileage: '',
    exteriorColor: '',
    interiorColor: '',
    numberOfKeys: '',
    
    // Deal Information
    dealType: '',
    fundingSource: '',
    purchaseDate: '',
    paymentMethod: '',
    currentStage: 'initial-contact',
    
    // Financial Information
    purchasePrice: '',
    listPrice: '',
    killPrice: '',
    wholesalePrice: '',
    commissionRate: '',
    brokerageFee: '',
    brokeerageFeePaidTo: '',
    payoffBalance: '',
    amountDueToCustomer: '',
    amountDueToRP: '',
    
    // Seller Information
    sellerName: '',
    sellerCompany: '',
    sellerAddress: '',
    sellerPhone: '',
    sellerEmail: '',
    
    // RP Information
    rpStockNumber: '',
    vehicleDescription: '',
    generalNotes: '',
    
    // Documentation
    contractRequired: false,
    titlePresent: false,
    driverLicensePresent: false,
    odometerPresent: false,
    dealerLicensePresent: false
  });

  const [vinDecoding, setVinDecoding] = useState(false);
  const [vinDecoded, setVinDecoded] = useState(false);
  const [dealerSuggestions, setDealerSuggestions] = useState([]);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const dealTypes = [
    { value: 'wholesale-d2d', label: 'Wholesale - D2D' },
    { value: 'wholesale-private', label: 'Wholesale - Private Party' },
    { value: 'wholesale-flip', label: 'Wholesale - Flip' },
    { value: 'retail-pp', label: 'Retail - PP' },
    { value: 'retail-auction', label: 'Retail - Auction' },
    { value: 'retail-dtod', label: 'Retail - DtoD' },
    { value: 'auction', label: 'Auction' }
  ];

  const fundingSources = [
    { value: 'flpn-retail', label: 'FLPN - Retail' },
    { value: 'flpn-wholesale', label: 'FLPN - Wholesale' },
    { value: 'cash', label: 'Cash' },
    { value: 'flooring-line', label: 'Flooring Line' },
    { value: 'consignment', label: 'Consignment' }
  ];

  const paymentMethods = [
    { value: 'check', label: 'Check' },
    { value: 'wire', label: 'Wire Transfer' },
    { value: 'ach', label: 'ACH' },
    { value: 'cash', label: 'Cash' },
    { value: 'financed', label: 'Financed' }
  ];

  const dealStages = [
    { value: 'initial-contact', label: 'Initial Contact' },
    { value: 'price-negotiated', label: 'Price Negotiated' },
    { value: 'inspection-scheduled', label: 'Inspection Scheduled' },
    { value: 'inspection-complete', label: 'Inspection Complete' },
    { value: 'purchased', label: 'Purchased' },
    { value: 'title-processing', label: 'Title Processing' },
    { value: 'title-received', label: 'Title Received' },
    { value: 'ready-to-list', label: 'Ready to List' },
    { value: 'listed', label: 'Listed' },
    { value: 'sold', label: 'Sold' },
    { value: 'delivered', label: 'Delivered' }
  ];

  // Real VIN decode function using API
  const decodeVIN = async (vin) => {
    setVinDecoding(true);
    try {
      const response = await ApiService.decodeVIN(vin);
      
      setFormData(prev => ({
        ...prev,
        year: response.data.year || prev.year,
        make: response.data.make || prev.make,
        model: response.data.model || prev.model
      }));
      
      setVinDecoded(true);
      setTimeout(() => setVinDecoded(false), 3000);
    } catch (error) {
      console.error('VIN decode error:', error);
      alert('VIN decode failed. Please enter details manually.');
    } finally {
      setVinDecoding(false);
    }
  };

  // Real dealer search using API
  const searchDealers = async (query) => {
    if (query.length < 2) {
      setDealerSuggestions([]);
      return;
    }
    
    try {
      const response = await ApiService.searchDealers(query);
      setDealerSuggestions(response.dealers || []);
    } catch (error) {
      console.error('Dealer search failed:', error);
      setDealerSuggestions([]);
    }
  };

  // Auto-generate stock number
  useEffect(() => {
    if (!formData.rpStockNumber && formData.year && formData.make) {
      const year = new Date().getFullYear();
      const stockNumber = `RP${year}${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`;
      setFormData(prev => ({ ...prev, rpStockNumber: stockNumber }));
    }
  }, [formData.year, formData.make, formData.rpStockNumber]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: null }));
    }
    
    // Trigger VIN decode when VIN is 17 characters
    if (field === 'vin' && value.length === 17 && !vinDecoded) {
      decodeVIN(value);
    }
    
    // Search dealers when typing in seller field
    if (field === 'sellerName') {
      searchDealers(value);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.vin || formData.vin.length !== 17) {
      errors.vin = 'Valid VIN (17 characters) required';
    }
    if (!formData.dealType) errors.dealType = 'Deal type required';
    if (!formData.year) errors.year = 'Year required';
    if (!formData.make) errors.make = 'Make required';
    if (!formData.model) errors.model = 'Model required';
    if (!formData.purchasePrice && currentUser.permissions.canViewFinancials) {
      errors.purchasePrice = 'Purchase price required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async (isDraft = false) => {
    if (!isDraft && !validateForm()) {
      return;
    }
    
    setSaving(true);
    
    try {
      const response = await ApiService.createDeal({
        ...formData,
        isDraft
      });
      
      console.log('Deal saved:', response);
      
      // Show success message or redirect
      alert(isDraft ? 'Draft saved successfully!' : 'Deal created successfully!');
      
      if (!isDraft) {
        // Redirect to deals list or reset form
        // window.location.href = '/deals';
      }
      
    } catch (error) {
      console.error('Save error:', error);
      alert(`Error saving deal: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEmailToListingTeam = () => {
    const emailBody = `New Vehicle Ready for Listing

Vehicle: ${formData.year} ${formData.make} ${formData.model}
VIN: ${formData.vin}
Stock #: ${formData.rpStockNumber}
Mileage: ${formData.mileage}
Exterior: ${formData.exteriorColor}
Interior: ${formData.interiorColor}

Description:
${formData.vehicleDescription}

Please prepare listing materials for this vehicle.

Best regards,
${currentUser.name}`;

    const mailtoLink = `mailto:listing@rpexotics.com?subject=New Vehicle for Listing - ${formData.year} ${formData.make} ${formData.model}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoLink);
  };

  const steps = [
    { id: 1, title: 'Vehicle Info', icon: Car },
    { id: 2, title: 'Deal Details', icon: FileText },
    { id: 3, title: 'Financial', icon: DollarSign },
    { id: 4, title: 'Seller Info', icon: User },
    { id: 5, title: 'Documentation', icon: Shield }
  ];

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center space-x-4 mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 cursor-pointer ${
              currentStep >= step.id
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'border-gray-600 text-gray-400 hover:border-gray-500'
            }`}
            onClick={() => setCurrentStep(step.id)}
          >
            <step.icon className="h-5 w-5" />
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-12 h-0.5 mx-2 transition-all duration-300 ${
                currentStep > step.id ? 'bg-blue-500' : 'bg-gray-600'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderFormField = (label, field, type = 'text', options = null, required = false, icon = null) => (
    <div className="space-y-2">
      <label className="flex items-center text-sm font-medium text-gray-300">
        {icon && <icon className="h-4 w-4 mr-2" />}
        {label}
        {required && <span className="text-red-400 ml-1">*</span>}
      </label>
      
      {type === 'select' ? (
        <select
          value={formData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          className={`w-full bg-white/10 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            formErrors[field] ? 'border-red-500' : 'border-white/20 hover:border-white/30'
          }`}
        >
          <option value="">Select {label}</option>
          {options?.map(option => (
            <option key={option.value} value={option.value} className="bg-gray-800">
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          value={formData[field]}
          onChange={(e) => handleInputChange(field, e.target.value)}
          rows={4}
          placeholder={`Enter ${label.toLowerCase()}...`}
          className={`w-full bg-white/10 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none ${
            formErrors[field] ? 'border-red-500' : 'border-white/20 hover:border-white/30'
          }`}
        />
      ) : type === 'checkbox' ? (
        <label className="flex items-center space-x-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.checked)}
            className="rounded bg-white/10 border-white/20 text-blue-500 focus:ring-blue-500"
          />
          <span className="text-gray-300">{label}</span>
        </label>
      ) : (
        <div className="relative">
          <input
            type={type}
            value={formData[field]}
            onChange={(e) => handleInputChange(field, e.target.value)}
            placeholder={`Enter ${label.toLowerCase()}...`}
            className={`w-full bg-white/10 border rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              formErrors[field] ? 'border-red-500' : 'border-white/20 hover:border-white/30'
            } ${field === 'vin' ? 'pr-20' : ''}`}
          />
          
          {field === 'vin' && formData.vin.length === 17 && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              {vinDecoding ? (
                <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
              ) : vinDecoded ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : (
                <button
                  onClick={() => decodeVIN(formData.vin)}
                  className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-2 py-1 rounded transition-colors"
                >
                  Decode
                </button>
              )}
            </div>
          )}
          
          {field === 'sellerName' && dealerSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 border border-white/20 rounded-lg shadow-xl z-10 max-h-40 overflow-y-auto">
              {dealerSuggestions.map(dealer => (
                <div
                  key={dealer.id}
                  className="p-3 hover:bg-white/10 cursor-pointer border-b border-white/10 last:border-b-0"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      sellerName: dealer.name,
                      sellerCompany: dealer.company,
                      sellerPhone: dealer.phone
                    }));
                    setDealerSuggestions([]);
                  }}
                >
                  <div className="font-medium text-white">{dealer.name}</div>
                  <div className="text-sm text-gray-400">{dealer.company} • {dealer.location}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {formErrors[field] && (
        <div className="flex items-center text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 mr-1" />
          {formErrors[field]}
        </div>
      )}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              {renderFormField('VIN', 'vin', 'text', null, true, Hash)}
            </div>
            {renderFormField('Deal Type', 'dealType', 'select', dealTypes, true, Car)}
            {renderFormField('Year', 'year', 'number', null, true, Calendar)}
            {renderFormField('Make', 'make', 'text', null, true)}
            {renderFormField('Model', 'model', 'text', null, true)}
            {renderFormField('Mileage', 'mileage', 'number', null, false, Gauge)}
            {renderFormField('Exterior Color', 'exteriorColor', 'text', null, false, Palette)}
            {renderFormField('Interior Color', 'interiorColor', 'text', null, false, Palette)}
            {renderFormField('Number of Keys', 'numberOfKeys', 'number', null, false, Key)}
          </div>
        );
      
      case 2:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderFormField('Funding Source', 'fundingSource', 'select', fundingSources, true, DollarSign)}
            {renderFormField('Purchase/Sale Date', 'purchaseDate', 'date', null, true, Calendar)}
            {renderFormField('Payment Method', 'paymentMethod', 'select', paymentMethods, true)}
            {renderFormField('Current Deal Stage', 'currentStage', 'select', dealStages, true, Clock)}
            <div className="md:col-span-2">
              {renderFormField('RP Stock Number', 'rpStockNumber', 'text', null, false, Hash)}
            </div>
          </div>
        );
      
      case 3:
        return currentUser.permissions.canViewFinancials ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderFormField('Purchase Price', 'purchasePrice', 'number', null, true, DollarSign)}
            {renderFormField('List Price', 'listPrice', 'number')}
            {renderFormField('Kill Price', 'killPrice', 'number')}
            {renderFormField('Wholesale Price', 'wholesalePrice', 'number')}
            {renderFormField('Commission Rate (%)', 'commissionRate', 'number')}
            {renderFormField('Brokerage Fee', 'brokerageFee', 'number')}
            {renderFormField('Payoff Balance', 'payoffBalance', 'number')}
            {renderFormField('Amount Due to Customer', 'amountDueToCustomer', 'number')}
            {renderFormField('Amount Due to RP', 'amountDueToRP', 'number')}
            {renderFormField('Brokerage Fee Paid To', 'brokeerageFeePaidTo', 'text')}
          </div>
        ) : (
          <div className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Financial Information Restricted</h3>
            <p className="text-gray-400">You don't have permission to view or edit financial details.</p>
          </div>
        );
      
      case 4:
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              {renderFormField('Purchased From', 'sellerName', 'text', null, true, User)}
            </div>
            {renderFormField('Company/Dealer', 'sellerCompany', 'text')}
            {renderFormField('Phone', 'sellerPhone', 'tel', null, false, Phone)}
            {renderFormField('Email', 'sellerEmail', 'email', null, false, Mail)}
            <div className="md:col-span-2">
              {renderFormField('Address', 'sellerAddress', 'text', null, false, MapPin)}
            </div>
          </div>
        );
      
      case 5:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-4">Documentation Status</h3>
                {renderFormField('Contract Required', 'contractRequired', 'checkbox')}
                {renderFormField('Title Present', 'titlePresent', 'checkbox')}
                {renderFormField('Driver License Present', 'driverLicensePresent', 'checkbox')}
                {renderFormField('Odometer Present', 'odometerPresent', 'checkbox')}
                {renderFormField('Dealer License Present', 'dealerLicensePresent', 'checkbox')}
              </div>
              <div>
                {renderFormField('Vehicle Description', 'vehicleDescription', 'textarea', null, false, FileText)}
              </div>
            </div>
            <div>
              {renderFormField('General Notes', 'generalNotes', 'textarea', null, false, Info)}
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="relative bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => navigate('/')}
                className="mr-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors"
                title="Back to Dashboard"
              >
                <Home className="h-5 w-5 text-white" />
              </button>
              <div className="flex items-center">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl p-3 mr-4 shadow-lg shadow-blue-500/25">
                  <Plus className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">New Deal Entry</h1>
                  <p className="text-gray-300 text-sm">Create a new vehicle deal</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/20 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Draft
              </button>
              
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg shadow-lg transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                Create Deal
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="relative max-w-6xl mx-auto px-6 py-8">
        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Form Content */}
        <div className="bg-white/5 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {steps[currentStep - 1]?.title}
            </h2>
            <p className="text-gray-300">
              {currentStep === 1 && 'Enter basic vehicle information and VIN details'}
              {currentStep === 2 && 'Configure deal type, funding, and timeline'}
              {currentStep === 3 && 'Set pricing and financial terms'}
              {currentStep === 4 && 'Add seller contact information'}
              {currentStep === 5 && 'Document status and additional notes'}
            </p>
          </div>

          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="flex items-center px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </button>

            <div className="flex items-center space-x-3">
              {currentStep === 5 && formData.vehicleDescription && (
                <button
                  onClick={handleEmailToListingTeam}
                  className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Email to Listing Team
                </button>
              )}
              
              {currentStep < 5 ? (
                <button
                  onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
                  className="flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-lg transition-colors"
                >
                  Next
                  <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                </button>
              ) : (
                <button
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="flex items-center px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Complete Deal
                </button>
              )}
            </div>
          </div>
        </div>

        {/* VIN Decode Status */}
        {vinDecoding && (
          <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Decoding VIN...
          </div>
        )}
        
        {vinDecoded && (
          <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            VIN decoded successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default NewDealEntry; 