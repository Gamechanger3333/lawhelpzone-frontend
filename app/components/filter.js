"use client";
const Filters = () => {
  return (
    <div className="flex flex-wrap gap-3 p-4 border-b bg-gray-50">
      <button className="px-4 py-2 border rounded-md">Category</button>
      <button className="px-4 py-2 border rounded-md">Service Options</button>
      <button className="px-4 py-2 border rounded-md">Lawyer Details</button>
      <button className="px-4 py-2 border rounded-md">Budget</button>
      <button className="px-4 py-2 border rounded-md">Delivery Time</button>
    </div>
  );
};

export default Filters;
