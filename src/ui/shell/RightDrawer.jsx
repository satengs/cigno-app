export default function RightDrawer({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl border-l z-50">
      <div className="flex items-center justify-between p-3 border-b">
        <h2 className="text-lg font-medium text-gray-900">Right Drawer</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          ×
        </button>
      </div>
      <div className="p-4">
        <p className="text-sm text-gray-500">Drawer content will go here</p>
      </div>
    </div>
  );
}
