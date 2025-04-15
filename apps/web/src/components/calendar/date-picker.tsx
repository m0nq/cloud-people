'use client';
import { ReactNode } from 'react';
import { ChangeEvent } from 'react';
import { useCallback } from 'react';
import { useState } from 'react';
import { useMemo } from 'react';

import { Modal } from '@mantine/core';
import { UnstyledButton } from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { DatesProvider } from '@mantine/dates';
import { TimeInput } from '@mantine/dates';
import dayjs from 'dayjs';
import '@mantine/dates/styles.css';
import '@mantine/core/styles.css';

import { Button } from '@components/utils/button/button';
import { ChevronIcon } from '@components/icons/chevron-icon';
import './date-picker.styles.css';

interface DatePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onDateSelect: (date: Date) => void;
    initialDate?: Date;
}

export const DatePicker = ({ isOpen, onClose, onDateSelect, initialDate }: DatePickerProps): ReactNode => {
    const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date());
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [showTimeInput, setShowTimeInput] = useState(false);

    const handleDayClick = (day: Date) => {
        setSelectedDate(day);
        setShowTimeInput(true);
    };

    const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSelectedTime(e.target.value);
    };

    const handleSubmit = () => {
        if (selectedDate && selectedTime) {
            const [hours, minutes] = selectedTime.split(':');
            const date = new Date(selectedDate);
            date.setHours(parseInt(hours), parseInt(minutes));
            onDateSelect(date);
            onClose();
        }
    };

    const config = useMemo(() => ({
            settings: {
                consistentWeeks: true,
                theme: { colorScheme: 'dark' }
            }
        }),
        []
    );

    return (
        <Modal
            opened={isOpen}
            onClose={onClose}
            centered
            padding={0}
            size="auto"
            radius="lg"
            styles={{
                content: {
                    backgroundColor: '#2a2f3b'
                },
                header: {
                    display: 'none'
                },
                body: {
                    padding: 0
                }
            }}>
            <div className="calendar-container">
                <DatesProvider settings={config.settings}>
                    <Calendar
                        getDayProps={(date: Date) => ({
                            selected: selectedDate ? dayjs(date).isSame(selectedDate, 'date') : false,
                            onClick: () => handleDayClick(date)
                        })}
                        firstDayOfWeek={0}
                        aria-label="Date Time Picker"
                    />
                    <UnstyledButton className="time-toggle-button" onClick={() => setShowTimeInput(!showTimeInput)}>
                        <div className="time-toggle-content">
                            <span>Time (Optional)</span>
                            <ChevronIcon className={showTimeInput ? 'chevron-rotated' : ''} />
                        </div>
                    </UnstyledButton>
                    {showTimeInput && (
                        <div className="time-input-container">
                            <TimeInput value={selectedTime} onChange={handleTimeChange} />
                        </div>
                    )}
                </DatesProvider>
            </div>
            <div className="button-container">
                <Button className="cancel-button" onClick={onClose}>
                    Cancel
                </Button>
                <Button className="submit-button" disabled={!selectedDate || !selectedTime} onClick={handleSubmit}>
                    Select
                </Button>
            </div>
        </Modal>
    );
};
