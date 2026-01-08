import { Injectable, signal, computed } from '@angular/core';
import { Department, Employee, AvailabilityStatus, BackupEmployee, BackupCustomer, Customer, EmployeePhone } from '../models/workforce.types';
import { Observable, of, delay } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class WorkforceService {

    // --- Mock Data Storage (in-memory) ---
    private departments = signal<Department[]>([
        { id: 'd1', deptNumber: '101', deptName: 'Sales' },
        { id: 'd2', deptNumber: '102', deptName: 'Support' },
        { id: 'd3', deptNumber: '103', deptName: 'Engineering' }
    ]);

    private employees = signal<Employee[]>([
        { id: 'e1', empNumber: 'E001', deptNumber: '101', firstName: 'John', lastName: 'Doe' },
        { id: 'e2', empNumber: 'E002', deptNumber: '101', firstName: 'Jane', lastName: 'Smith' },
        { id: 'e3', empNumber: 'E003', deptNumber: '102', firstName: 'Bob', lastName: 'Jones' },
        { id: 'e4', empNumber: 'E004', deptNumber: '102', firstName: 'Alice', lastName: 'Williams' },
        { id: 'e5', empNumber: 'E005', deptNumber: '103', firstName: 'Charlie', lastName: 'Brown' }
    ]);

    private phones = signal<EmployeePhone[]>([
        { id: 'p1', empNumber: 'E001', phoneNumber: '555-0101', purpose: 'Primary' },
        { id: 'p2', empNumber: 'E002', phoneNumber: '555-0102', purpose: 'Primary' },
        { id: 'p3', empNumber: 'E003', phoneNumber: '555-0103', purpose: 'Primary' },
        { id: 'p4', empNumber: 'E003', phoneNumber: '555-0000', purpose: 'Mobile' },
        { id: 'p5', empNumber: 'E004', phoneNumber: '555-0104', purpose: 'Primary' },
        { id: 'p6', empNumber: 'E005', phoneNumber: '555-0105', purpose: 'Primary' }
    ]);

    private customers = signal<Customer[]>([
        { id: 'c1', custNumber: 'C001', responsibleEmpNumber: 'E001', firstName: 'Client', lastName: 'One', phoneNumber: '123-456' },
        { id: 'c2', custNumber: 'C002', responsibleEmpNumber: 'E001', firstName: 'Client', lastName: 'Two', phoneNumber: '123-457' },
        { id: 'c3', custNumber: 'C003', responsibleEmpNumber: 'E003', firstName: 'Client', lastName: 'Three', phoneNumber: '123-458' }
    ]);

    private availabilityLog = signal<AvailabilityStatus[]>([
        { id: 'a1', empNumber: 'E001', status: 'Available', effectiveDateTime: '2023-01-01T09:00:00' },
        { id: 'a2', empNumber: 'E003', status: 'Available', effectiveDateTime: '2023-01-01T09:00:00' },
        { id: 'a3', empNumber: 'E001', status: 'Not Available', effectiveDateTime: '2026-01-08T10:00:00' } // Example future/current
    ]);

    private backupLog = signal<BackupEmployee[]>([
        { id: 'b1', backupEmpNumber: 'E002', backedUpEmpNumber: 'E001', effectiveDateTime: '2026-01-08T10:00:00' }
    ]);

    private backupCustomers = signal<BackupCustomer[]>([
        // Example: E002 backs up E001 only for Client One (C001)
        { id: 'bc1', custNumber: 'C001', backupEmployeeId: 'b1', effectiveDateTime: '2026-01-08T10:00:00' }
    ]);

    constructor() { }

    // --- Getters ---
    getDepartments() { return this.departments; }
    getEmployees() { return this.employees; }

    getEmployeesByDept(deptNumber: string) {
        return computed(() => this.employees().filter(e => e.deptNumber === deptNumber));
    }

    getEmployeePhone(empNumber: string) {
        // Return primary phone or first one
        return computed(() => {
            const all = this.phones().filter(p => p.empNumber === empNumber);
            return all.find(p => p.purpose === 'Primary') || all[0];
        });
    }

    getCustomersForEmployee(empNumber: string) {
        return computed(() => this.customers().filter(c => c.responsibleEmpNumber === empNumber));
    }

    // --- Logic for Time-Travel ---

    // --- Improved Logic for Time-Travel & Windows ---

    getAvailabilityWindow(empNumber: string, targetTime: Date) {
        const logs = this.availabilityLog().filter(a => a.empNumber === empNumber);
        // Sort asc by time
        const sorted = logs.sort((a, b) => new Date(a.effectiveDateTime).getTime() - new Date(b.effectiveDateTime).getTime());

        // Find Index of current status
        // Current status is the last one where effectiveDateTime <= targetTime
        let currentIndex = -1;
        for (let i = 0; i < sorted.length; i++) {
            if (new Date(sorted[i].effectiveDateTime) <= targetTime) {
                currentIndex = i;
            } else {
                break;
            }
        }

        const current = currentIndex >= 0 ? sorted[currentIndex] : undefined;
        // Next status is the one immediately after current
        const next = currentIndex + 1 < sorted.length ? sorted[currentIndex + 1] : undefined;

        return { current, next };
    }

    // Get all backup assignments ACTIVE at targetTime for a backed-up employee
    // Since multiple people might back up one person? Or one person backs up?
    // "Backup Employee" entity relates BackupEmp -> BackedUpEmp.
    // If I am BackedUpEmp, who is backing me up?
    // Logic: Find the latest effective record for this pair?
    // Actually, the prompt implies "Backup Employee" entity defines a PERIOD.
    // So for a given BackedUpEmp, we find the active Backup Record.
    getBackupWindow(backedUpEmpNumber: string, targetTime: Date) {
        const logs = this.backupLog().filter(b => b.backedUpEmpNumber === backedUpEmpNumber);
        const sorted = logs.sort((a, b) => new Date(a.effectiveDateTime).getTime() - new Date(b.effectiveDateTime).getTime());

        let currentIndex = -1;
        for (let i = 0; i < sorted.length; i++) {
            if (new Date(sorted[i].effectiveDateTime) <= targetTime) {
                currentIndex = i;
            } else {
                break;
            }
        }

        let current = currentIndex >= 0 ? sorted[currentIndex] : undefined;
        // Check explicit end time
        if (current && current.endDateTime && new Date(current.endDateTime) <= targetTime) {
            current = undefined;
        }

        // Logic for "next" remains effectively next scheduled start, ignoring that this one ended.
        const next = currentIndex + 1 < sorted.length ? sorted[currentIndex + 1] : undefined;


        return { current, next };
    }

    getBackupCustomers(backupRecordId: string) {
        return this.backupCustomers().filter(bc => bc.backupEmployeeId === backupRecordId);
    }

    // Get list of ALL future statuses for editing
    getFutureAvailability(empNumber: string, relativeTo: Date) {
        return this.availabilityLog()
            .filter(a => a.empNumber === empNumber && new Date(a.effectiveDateTime) >= relativeTo)
            .sort((a, b) => new Date(a.effectiveDateTime).getTime() - new Date(b.effectiveDateTime).getTime());
    }

    // --- Actions ---

    // Updated to support Description and optional validation check (handled by caller usually)
    updateAvailabilityBatch(empNumbers: string[], status: 'Available' | 'Not Available', effectiveDateTime: string, description?: string) {
        const newLogs = empNumbers.map(emp => ({
            id: Math.random().toString(36).substr(2, 9),
            empNumber: emp,
            status,
            effectiveDateTime,
            description
        }));

        // Remove existing logs relative to exact same time if they exist? Or just append?
        // Prompt says "prevent overlap".
        // For batch, we usually append. But let's check basic overwrite if exact time matches for user.
        this.availabilityLog.update(current => {
            // Filter out any that have exact same ID (not possible here) or exact same Time+Emp
            // Simple approach: just append. The getter logic handles "latest".
            // But optimal: replace if exact time match.
            const filtered = current.filter(c =>
                !newLogs.some(n => n.empNumber === c.empNumber && n.effectiveDateTime === c.effectiveDateTime)
            );
            return [...filtered, ...newLogs];
        });
    }

    // Add a single status with validation logic options
    addAvailabilityStatus(status: AvailabilityStatus) {
        this.availabilityLog.update(current => {
            // Remove exact match if exists
            const filtered = current.filter(c => !(c.empNumber === status.empNumber && c.effectiveDateTime === status.effectiveDateTime));
            return [...filtered, status];
        });
    }

    addBackupRecord(backupEmpNumber: string, backedUpEmpNumber: string, effectiveDateTime: string, endDateTime?: string): string {
        const id = Math.random().toString(36).substr(2, 9);
        const record: BackupEmployee = { id, backupEmpNumber, backedUpEmpNumber, effectiveDateTime, endDateTime };
        this.backupLog.update(current => [...current, record]);
        return id;
    }

    addBackupCustomerLink(backupRecordId: string, custNumber: string, effectiveDateTime: string) {
        const record: BackupCustomer = {
            id: Math.random().toString(36).substr(2, 9),
            backupEmployeeId: backupRecordId,
            custNumber,
            effectiveDateTime
        };
        this.backupCustomers.update(current => [...current, record]);
    }
}
