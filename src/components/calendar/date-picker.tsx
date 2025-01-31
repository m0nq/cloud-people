'use client';

import { ReactNode } from 'react';
import { useCallback } from 'react';
import { useState } from 'react';
import '@mantine/dates/styles.css';
import '@mantine/core/styles.css';
import { Modal } from '@mantine/core';
import { DatePickerInput } from '@mantine/dates';
import { DateValue } from '@mantine/dates';
import moment from 'moment';

import './date-picker.styles.css';

interface DatePickerProps {
    isOpen: boolean;
    onClose: () => void;
    onDateSelect: (date: Date) => void;
}

const getDayProps = (date: Date) => {
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 5 && date.getDate() === 13) {
        return {
            style: {
                backgroundColor: 'var(--mantine-color-red-filled)',
                color: 'var(--mantine-color-white)'
            }
        };
    }

    return {};
};

export const DatePicker = ({ isOpen, onClose, onDateSelect }: DatePickerProps): ReactNode => {
    // const [value, setValue] = useState<Date | null>(null);
    const [date, setDate] = useState(moment().toDate());

    const handleDateSelect = useCallback(
        (value: DateValue) => {
            if (value !== null) {
                setDate((current: Date) => new Date(current.getFullYear() + 1, 1));
            }

            setDate(moment(value).toDate());
        },
        [onClose, onDateSelect]
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
                {/* TODO: give user ability to change first day of week */}
                <DatePickerInput
                    placeholder={date?.toDateString() ?? 'Pick date'}
                    value={date}
                    onChange={handleDateSelect}
                    allowDeselect
                    firstDayOfWeek={0}
                    getDayProps={getDayProps}
                />
            </div>
            {/* <div className="button-container">
             <Button variant="default" className="cancel-button" onClick={onClose}>
             Cancel
             </Button>
             <Button className="submit-button" onClick={() => handleDateSelect(new Date())}>
             Choose Date
             </Button>
             </div> */}
        </Modal>
    );
};
