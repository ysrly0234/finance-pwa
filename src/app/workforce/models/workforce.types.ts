export interface Department {
    id: string;
    deptNumber: string;
    deptName: string;
}

export interface Employee {
    id: string;
    empNumber: string;
    deptNumber: string;
    firstName: string;
    lastName: string;
}

export interface EmployeePhone {
    id: string;
    empNumber: string;
    phoneNumber: string;
    purpose: string; // e.g. 'Primary'
}

export interface Customer {
    id: string;
    custNumber: string;
    responsibleEmpNumber: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
}

export type AvailabilityType = 'Available' | 'Not Available';

export interface AvailabilityStatus {
    id: string;
    empNumber: string;
    status: AvailabilityType;
    effectiveDateTime: string; // ISO string
    description?: string; // Max 64 chars
}

export interface BackupEmployee {
    id: string;
    backupEmpNumber: string;
    backedUpEmpNumber: string;
    effectiveDateTime: string; // ISO string
    endDateTime?: string; // ISO string (Optional)
}

export interface BackupCustomer {
    id: string;
    custNumber: string;
    backupEmployeeId: string; // Links to BackupEmployee.id
    effectiveDateTime: string; // ISO string
}
