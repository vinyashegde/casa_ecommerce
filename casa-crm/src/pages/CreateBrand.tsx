import React, { useState } from 'react';

const BrandForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    logo_url: '',
    description: '',
    website: '',
    email: '',
    password: '',
    social_links: [''],
    is_active: true,
    store_addresses: [
      {
        street: '',
        city: '',
        state: '',
        country: '',
        pincode: '',
        landmark: ''
      }
    ],
    emergency_contact: {
      name: '',
      email: '',
      number: '',
      working_hours: ''
    },
    return_policy: '',
    shipping_policy: '',
    store_policy: '',
    bank_details: {
      account_number: '',
      ifsc_code: '',
      upi_id: ''
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, path: string) => {
    const keys = path.split('.');
    setFormData(prev => {
      const updated = { ...prev };
      let ref: any = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        ref = ref[keys[i]];
      }
      ref[keys[keys.length - 1]] = e.target.value;
      return updated;
    });
  };

  return (
    <form className="max-w-2xl mx-auto p-6 space-y-6 bg-white shadow rounded-lg">
      <h2 className="text-2xl font-bold">Create Brand</h2>

      <input className="w-full border p-2 rounded" placeholder="Brand Name" value={formData.name} onChange={e => handleChange(e, 'name')} />
      <input className="w-full border p-2 rounded" placeholder="Logo URL" value={formData.logo_url} onChange={e => handleChange(e, 'logo_url')} />
      <textarea className="w-full border p-2 rounded" placeholder="Description" value={formData.description} onChange={e => handleChange(e, 'description')} />
      <input className="w-full border p-2 rounded" placeholder="Website" value={formData.website} onChange={e => handleChange(e, 'website')} />
      <input className="w-full border p-2 rounded" placeholder="Email" value={formData.email} onChange={e => handleChange(e, 'email')} />
      <input className="w-full border p-2 rounded" placeholder="Password" type="password" value={formData.password} onChange={e => handleChange(e, 'password')} />

      <div className="space-y-2">
        <h3 className="font-semibold">Store Address</h3>
        {formData.store_addresses.map((store, i) => (
          <div key={i} className="grid grid-cols-2 gap-2">
            <input className="border p-2 rounded" placeholder="Street" value={store.street} onChange={e => {
              const updated = [...formData.store_addresses];
              updated[i].street = e.target.value;
              setFormData(prev => ({ ...prev, store_addresses: updated }));
            }} />
            <input className="border p-2 rounded" placeholder="City" value={store.city} onChange={e => {
              const updated = [...formData.store_addresses];
              updated[i].city = e.target.value;
              setFormData(prev => ({ ...prev, store_addresses: updated }));
            }} />
            <input className="border p-2 rounded" placeholder="State" value={store.state} onChange={e => {
              const updated = [...formData.store_addresses];
              updated[i].state = e.target.value;
              setFormData(prev => ({ ...prev, store_addresses: updated }));
            }} />
            <input className="border p-2 rounded" placeholder="Country" value={store.country} onChange={e => {
              const updated = [...formData.store_addresses];
              updated[i].country = e.target.value;
              setFormData(prev => ({ ...prev, store_addresses: updated }));
            }} />
            <input className="border p-2 rounded" placeholder="Pincode" value={store.pincode} onChange={e => {
              const updated = [...formData.store_addresses];
              updated[i].pincode = e.target.value;
              setFormData(prev => ({ ...prev, store_addresses: updated }));
            }} />
            <input className="border p-2 rounded" placeholder="Landmark" value={store.landmark} onChange={e => {
              const updated = [...formData.store_addresses];
              updated[i].landmark = e.target.value;
              setFormData(prev => ({ ...prev, store_addresses: updated }));
            }} />
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Emergency Contact</h3>
        <input className="w-full border p-2 rounded" placeholder="Name" value={formData.emergency_contact.name} onChange={e => handleChange(e, 'emergency_contact.name')} />
        <input className="w-full border p-2 rounded" placeholder="Email" value={formData.emergency_contact.email} onChange={e => handleChange(e, 'emergency_contact.email')} />
        <input className="w-full border p-2 rounded" placeholder="Number" value={formData.emergency_contact.number} onChange={e => handleChange(e, 'emergency_contact.number')} />
        <input className="w-full border p-2 rounded" placeholder="Working Hours" value={formData.emergency_contact.working_hours} onChange={e => handleChange(e, 'emergency_contact.working_hours')} />
      </div>

      <div className="space-y-2">
        <h3 className="font-semibold">Bank Details</h3>
        <input className="w-full border p-2 rounded" placeholder="Account Number" value={formData.bank_details.account_number} onChange={e => handleChange(e, 'bank_details.account_number')} />
        <input className="w-full border p-2 rounded" placeholder="IFSC Code" value={formData.bank_details.ifsc_code} onChange={e => handleChange(e, 'bank_details.ifsc_code')} />
        <input className="w-full border p-2 rounded" placeholder="UPI ID" value={formData.bank_details.upi_id} onChange={e => handleChange(e, 'bank_details.upi_id')} />
      </div>

      <textarea className="w-full border p-2 rounded" placeholder="Return Policy" value={formData.return_policy} onChange={e => handleChange(e, 'return_policy')} />
      <textarea className="w-full border p-2 rounded" placeholder="Shipping Policy" value={formData.shipping_policy} onChange={e => handleChange(e, 'shipping_policy')} />
      <textarea className="w-full border p-2 rounded" placeholder="Store Policy" value={formData.store_policy} onChange={e => handleChange(e, 'store_policy')} />

      <button type="submit" className="w-full py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Submit</button>
    </form>
  );
};

export default BrandForm;
