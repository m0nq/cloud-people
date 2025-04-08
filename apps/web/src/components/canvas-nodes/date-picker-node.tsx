import { ReactNode } from 'react';
import { useState } from 'react';
import { useThemeStore } from '@stores/theme-store';
import { DatePicker } from '@components/calendar/date-picker';
import './node.styles.css';

type DatePickerNodeProps = {
    data: {
        id: string;
        label?: string;
        selectedDate?: Date;
    };
};

const DatePickerNode = ({ data }: DatePickerNodeProps): ReactNode => {
    const { isDarkMode } = useThemeStore();
    const [isOpen, setIsOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(data.selectedDate);

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
        setIsOpen(false);
    };

    return (
        <div className="date-picker-node nodrag">
            <div className="date-picker-header">
                <h3>Schedule</h3>
                {selectedDate && (
                    <span className="selected-date">
                        {selectedDate.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric'
                        })}
                    </span>
                )}
            </div>
            <button 
                className="date-picker-button"
                onClick={() => setIsOpen(true)}
            >
                {selectedDate ? 'Change Date' : 'Select Date'}
            </button>
            {isOpen && (
                <div className="date-picker-modal">
                    <DatePicker
                        isOpen={isOpen}
                        onClose={() => setIsOpen(false)}
                        onDateSelect={handleDateSelect}
                        initialDate={selectedDate}
                    />
                </div>
            )}
        </div>
    );
};

export default DatePickerNode;
