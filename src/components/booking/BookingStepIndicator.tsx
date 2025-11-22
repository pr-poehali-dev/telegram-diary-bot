interface BookingStepIndicatorProps {
  currentStep: number;
}

export default function BookingStepIndicator({ currentStep }: BookingStepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
            currentStep >= s ? 'bg-primary text-white' : 'bg-gray-200 text-gray-500'
          }`}
        >
          {s}
        </div>
      ))}
    </div>
  );
}
