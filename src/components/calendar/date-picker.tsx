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
}

export const DatePicker = ({ isOpen, onClose, onDateSelect }: DatePickerProps): ReactNode => {
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [showTimeInput, setShowTimeInput] = useState(false);

    const handleDateSelect = useCallback(
        (date: Date) => {
            // If clicking the same date, unselect it
            if (selectedDate && dayjs(date).isSame(selectedDate, 'date')) {
                setSelectedDate(null);
            } else {
                setSelectedDate(date);
            }
        },
        [selectedDate]
    );

    const handleTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        if (!value) return;
        setSelectedTime(value);
    };

    const handleSubmit = () => {
        if (!selectedDate) return;

        let finalDateTime: Date;
        if (selectedTime) {
            // If time is selected, combine date with selected time
            const [hours, minutes] = selectedTime.split(':').map(Number);
            finalDateTime = dayjs(selectedDate)
                .hour(hours)
                .minute(minutes)
                .toDate();
        } else {
            // If no time selected, use current time
            const now = new Date();
            finalDateTime = dayjs(selectedDate)
                .hour(now.getHours())
                .minute(now.getMinutes())
                .toDate();
        }

        onDateSelect(finalDateTime);
        onClose();
    };

    const config = useMemo(
        () => ({
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
                            onClick: () => handleDateSelect(date)
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
                <Button className="submit-button" disabled={!selectedDate} onClick={handleSubmit}>
                    Select
                </Button>
            </div>
        </Modal>
    );
};
