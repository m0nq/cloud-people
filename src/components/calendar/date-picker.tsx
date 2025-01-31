'use client';
import dayjs from 'dayjs';
import { ReactNode } from 'react';
import { useCallback } from 'react';
import { useState } from 'react';
import { useMemo } from 'react';
import '@mantine/dates/styles.css';
import '@mantine/core/styles.css';
import { Modal } from '@mantine/core';
import { Calendar } from '@mantine/dates';
import { DatesProvider } from '@mantine/dates';

import './date-picker.styles.css';
import { Button } from '@components/utils/button/button';

interface DatePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onDateSelect: (dates: Date[]) => void;
}

export const DatePicker = ({ isOpen, onClose, onDateSelect }: DatePickerProps): ReactNode => {
    // const [value, setValue] = useState<Date | null>(null);
    // const [date, setDate] = useState(moment().toDate());
    const [selected, setSelected] = useState<Date[]>([]);

    const handleDateSelect = useCallback((date: Date) => {
        const isSelected = selected.some(s => dayjs(date).isSame(s, 'date'));
        if (isSelected) {
            setSelected(current => current.filter(d => !dayjs(d).isSame(date, 'date')));
        } else if (selected.length < 3) {
            setSelected(current => [...current, date]);
        }
    }, [onDateSelect]);

    const config = useMemo(() => ({
        settings: {
            consistentWeeks: true,
            theme: { colorScheme: 'dark' }
        }
    }), []);

    return (
        <Modal opened={isOpen}
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
                {/* TODO: give user ability to change first day of week */}
                <DatesProvider settings={config.settings}>
                    <Calendar
                        getDayProps={(date: Date) => ({
                            selected: selected.some(s => dayjs(date).isSame(s, 'date')),
                            onClick: () => handleDateSelect(date)
                        })}
                        firstDayOfWeek={0}
                        aria-label="Date Time Picker"
                    />
                </DatesProvider>
            </div>
            <div className="button-container">
                <Button className="cancel-button" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    className="submit-button"
                    onClick={() => {
                        onDateSelect(selected);
                        onClose();
                    }}>
                    Select
                </Button>
            </div>
        </Modal>
    );
};
