import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { WorkforceService } from '../../services/workforce.service';
import { AvailabilityStatus, AvailabilityType } from '../../models/workforce.types';

@Component({
    selector: 'app-edit-availability-dialog',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, FormsModule, MatDialogModule, MatButtonModule,
        MatFormFieldModule, MatInputModule, MatSelectModule, MatDatepickerModule,
        MatIconModule, MatTooltipModule, MatMenuModule
    ],
    host: {
        '(window:keydown)': 'handleKeyDown($event)',
        '(window:keyup)': 'handleKeyUp($event)'
    },
    template: `
    <h2 mat-dialog-title dir="rtl">עריכת רצף זמינות: {{ data.employee.firstName }}</h2>

    <mat-dialog-content class="dialog-content" dir="rtl">
        <!-- Controls -->
        <div class="header-controls">
            <div class="range-nav">
                <button mat-icon-button (click)="shiftMonth(-1)" matTooltip="חודש קודם"><mat-icon>chevron_right</mat-icon></button>
                <div class="range-display">
                    {{ startRange() | date: 'dd/MM/yyyy' }} - {{ endRange() | date: 'dd/MM/yyyy' }}
                </div>
                <button mat-icon-button (click)="shiftMonth(1)" matTooltip="חודש הבא"><mat-icon>chevron_left</mat-icon></button>
            </div>
            
            <button mat-flat-button color="primary" (click)="addNewNode()" class="add-node-btn">
                <mat-icon>add</mat-icon> הוסיף שינוי מצב
            </button>
        </div>

        <div class="timeline-wrapper" (mouseup)="stopDrag()" (mouseleave)="stopDrag()" (mousemove)="onDrag($event)">
            <!-- Time Axis -->
            <div class="timeline-line"></div>

            <!-- Current Time Line -->
            <div class="current-time-line" *ngIf="currentTimePos() >= 0 && currentTimePos() <= 100" [style.top.%]="currentTimePos()">
                <span class="now-label">עכשיו: {{ data.currentTime | date: 'dd/MM/yyyy HH:mm' }}</span>
            </div>

            <!-- Markers -->
            <ng-container *ngFor="let month of monthMarkers()">
                <div class="month-marker" [style.top.%]="month.pos">
                    <span class="marker-label">{{ month.date | date: 'MMM yyyy' }}</span>
                    <div class="marker-dash"></div>
                </div>
            </ng-container>

            <!-- Status Nodes -->
            <div *ngFor="let node of visibleNodes(); let i = index"
                class="status-node"
                [style.top.%]="node.pos"
                [style.padding-left.px]="node.horizontalOffset"
                [class.dragging]="draggingObj === node"
                [class.selected]="selectedNodeId() === node.data.id"
                [class.available]="node.data.status === 'Available'"
                [class.unavailable]="node.data.status === 'Not Available'"
                [class.error]="!!node.error"
                (click)="selectNode($event, node.data.id)">

                <!-- Handle -->
                <div class="node-handle"
                    [class.locked]="isLocked(node.data)"
                    (mousedown)="startDrag($event, node)">
                </div>

                <!-- Content Card -->
                <div class="node-content mat-elevation-z1" [class.side-start]="node.side === 'start'" [class.side-end]="node.side === 'end'">
                    <div class="node-row">
                        <span class="time-label">{{ node.data.effectiveDateTime | date: 'dd/MM/yyyy HH:mm' }}</span>
                        
                        <ng-container *ngIf="!isLocked(node.data); else readOnlyBody">
                            <!-- Status Tag with Menu -->
                            <div class="status-tag" [matMenuTriggerFor]="statusMenu" [class.available]="node.data.status === 'Available'" [class.unavailable]="node.data.status === 'Not Available'">
                                <span>{{ node.data.status === 'Available' ? 'פנוי' : 'לא פנוי' }}</span>
                                <mat-icon class="tag-arrow">expand_more</mat-icon>
                            </div>
                            <mat-menu #statusMenu="matMenu">
                                <button mat-menu-item (click)="updateStatus(node.data.id, 'Available')">פנוי</button>
                                <button mat-menu-item (click)="updateStatus(node.data.id, 'Not Available')">לא פנוי</button>
                            </mat-menu>

                            <mat-icon class="info-icon" 
                                [matTooltip]="node.data.description || 'אין תיאור'" 
                                [class.has-desc]="!!node.data.description">info</mat-icon>
                        </ng-container>
                        
                        <ng-template #readOnlyBody>
                            <div class="status-tag readonly" [class.available]="node.data.status === 'Available'" [class.unavailable]="node.data.status === 'Not Available'">
                                {{ node.data.status === 'Available' ? 'פנוי' : 'לא פנוי' }}
                            </div>
                            <span class="read-only-desc">{{ node.data.description || '' }}</span>
                        </ng-template>

                        <button class="delete-icon-btn" *ngIf="!isLocked(node.data)" (click)="deleteNode(node.data.id)" tabindex="-1" matTooltip="מחיקה">
                            <mat-icon>delete</mat-icon>
                        </button>
                    </div>

                    <div class="node-error" *ngIf="node.error">
                        <mat-icon>error</mat-icon> {{ node.error }}
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Selected Item Editor -->
        <div class="selection-footer" *ngIf="selectedNodeData() as sel">
            <div class="footer-label">
                עריכת תיאור עבור <strong>{{ sel.status === 'Available' ? 'פנוי' : 'לא פנוי' }}</strong> 
                בתאריך {{ sel.effectiveDateTime | date: 'dd/MM/yyyy HH:mm' }}
            </div>
            <mat-form-field appearance="outline" class="footer-input">
                <mat-label>תיאור המצב</mat-label>
                <input matInput [ngModel]="sel.description" (ngModelChange)="updateDesc(sel.id, $event)" placeholder="הזן תיאור...">
                <mat-icon matSuffix>edit</mat-icon>
            </mat-form-field>
        </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end" dir="rtl">
        <div class="action-row">
            <button mat-button color="warn" *ngIf="hasChanges()" (click)="revert()">ביטול שינויים</button>
            <button mat-flat-button color="primary" [disabled]="!isSaveEnabled()" (click)="save()">שמירת שינויים</button>
            <button mat-icon-button (click)="close()"><mat-icon>close</mat-icon></button>
        </div>
    </mat-dialog-actions>
  `,
    styles: [`
    .dialog-content { min-width: 800px; height: 750px; display: flex; flex-direction: column; gap: 10px; overflow: hidden; }
    .header-controls { display: flex; justify-content: space-between; align-items: center; padding: 10px 16px; background: #f8f9fa; border-bottom: 1px solid #e0e0e0; }
    .range-nav { display: flex; align-items: center; gap: 10px; }
    .range-display { font-weight: bold; font-size: 1.1rem; color: #333; }
    .add-node-btn { height: 40px; }
    
    .timeline-wrapper {
        flex: 1;
        position: relative;
        background: #fafafa;
        border: 1px solid #ddd;
        border-radius: 4px;
        margin: 10px 0;
        overflow: hidden;
        user-select: none;
    }

    .timeline-line {
        position: absolute;
        right: 120px;
        top: 0; bottom: 0;
        width: 2px;
        background: #ccc;
        z-index: 0;
    }
    
    .current-time-line {
        position: absolute;
        left: 0; right: 0;
        height: 2px;
        background: #2196f3;
        z-index: 5;
        pointer-events: none;
    }
    .now-label {
        position: absolute; left: 10px; top: -10px;
        background: rgba(33, 150, 243, 0.9); color: white; font-size: 0.75rem; padding: 2px 6px; border-radius: 4px;
        backdrop-filter: blur(2px);
    }
    
    .month-marker { position: absolute; left: 0; width: 100%; height: 0; border-top: 1px dashed #e0e0e0; pointer-events: none; }
    .marker-label { position: absolute; right: 10px; top: -10px; font-size: 0.8rem; color: #999; width: 100px; text-align: left; }
    
    .status-node {
        position: absolute;
        width: 100%;
        display: flex;
        align-items: center;
        transform: translateY(-50%);
        z-index: 10;
        transition: top 0.1s linear, padding-left 0.2s ease;
    }
    .status-node.dragging { z-index: 100; transition: none; }
    .status-node.selected { z-index: 101; }
    .status-node.selected .node-handle { border-width: 4px; box-shadow: 0 0 8px rgba(33, 150, 243, 0.6); outline: 2px solid #2196f3; outline-offset: 2px; }
    .status-node.selected .node-content { border-color: #2196f3; box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3); }
    
    .node-handle {
        position: absolute;
        right: 111px;
        width: 18px; height: 18px;
        border-radius: 50%;
        background: white;
        border: 3px solid gray;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        cursor: grab;
        z-index: 20;
    }
    .node-handle.locked { cursor: default; border-style: dotted; opacity: 0.8; }
    
    .status-node.available.node-handle { border-color: #4caf50; }
    .status-node.unavailable.node-handle { border-color: #f44336; }
    
    .node-content {
        position: absolute;
        background: rgba(255, 255, 255, 0.7);
        backdrop-filter: blur(8px);
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        padding: 4px 8px;
        min-width: fit-content;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        display: flex;
        flex-direction: column;
    }
    .node-content.side-start { right: 150px; }
    .node-content.side-end { right: 400px; }

    /* Horizontal connector line - dynamic length based on side */
    .node-content.side-start::before {
        content: '';
        position: absolute;
        right: -30px;
        top: 50%;
        width: 30px;
        height: 1px;
        background: rgba(0,0,0,0.15);
    }
    .node-content.side-end::before {
        content: '';
        position: absolute;
        right: -280px;
        top: 50%;
        width: 280px;
        height: 1px;
        background: rgba(0,0,0,0.15);
    }

    .status-node.error.node-content { border-color: #f44336; background: rgba(255, 240, 240, 0.8); }

    .node-row { display: flex; align-items: center; gap: 8px; white-space: nowrap; }
    .time-label { font-weight: bold; font-size: 0.8rem; color: #666; background: rgba(0,0,0,0.05); padding: 2px 8px; border-radius: 12px; }
    .delete-icon-btn {
        width: 32px; height: 32px;
        flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        border: none; background: transparent;
        cursor: pointer;
        border-radius: 50%;
        color: #888;
        transition: all 0.2s;
        padding: 0;
        margin: 0;
    }
    .delete-icon-btn mat-icon { font-size: 20px; width: 20px; height: 20px; }
    .delete-icon-btn:hover { background: rgba(244, 67, 54, 0.1); color: #f44336; }
    
    .status-tag {
        display: flex;
        align-items: center;
        gap: 2px;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.1s;
        border: 1px solid transparent;
    }
    .status-tag:hover { transform: scale(1.05); border-color: rgba(0,0,0,0.1); }
    .status-tag.available { background: rgba(232, 245, 233, 0.8); color: #2e7d32; }
    .status-tag.unavailable { background: rgba(255, 235, 238, 0.8); color: #c62828; }
    .status-tag.readonly { cursor: default; }
    .status-tag.readonly:hover { transform: none; border-color: transparent; }
    .tag-arrow { font-size: 14px; width: 14px; height: 14px; opacity: 0.6; margin-top: 1px; }
    
    .read-only-desc { font-style: italic; color: #777; font-size: 0.75rem; }

    .node-error { color: #d32f2f; font-size: 0.8rem; display: flex; align-items: center; gap: 4px; margin-top: 6px; padding-top: 4px; border-top: 1px solid rgba(211, 47, 47, 0.2); }
    .node-error mat-icon { font-size: 16px; width: 16px; height: 16px; }

    .info-icon { color: #ccc; font-size: 18px; width: 18px; height: 18px; cursor: help; }
    .info-icon.has-desc { color: #2196f3; }

    .selection-footer {
        padding: 16px;
        background: #f0f7ff;
        border: 1px solid #cce5ff;
        border-radius: 8px;
        margin-bottom: 10px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        animation: slideUp 0.3s ease;
    }
    @keyframes slideUp { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .footer-label { font-size: 0.9rem; color: #004085; }
    .footer-input { width: 100%; }
    ::ng-deep .footer-input .mat-mdc-form-field-subscript-wrapper { display: none; }

    .action-row { display: flex; gap: 8px; align-items: center; width: 100%; justify-content: flex-end; }
  `]
})
export class EditAvailabilityDialogComponent {
    data = inject(MAT_DIALOG_DATA);
    dialogRef = inject(MatDialogRef<EditAvailabilityDialogComponent>);
    service = inject(WorkforceService);

    // State
    originalStatuses: AvailabilityStatus[] = [];
    currentStatuses = signal<AvailabilityStatus[]>([]);

    // View Range
    centerTime = signal(new Date().getTime());
    rangeMs = 12 * 30 * 24 * 3600 * 1000; // 12 months roughly

    draggingObj: any = null;
    selectedNodeId = signal<string | null>(null);
    selectedNodeData = computed(() => this.currentStatuses().find(s => s.id === this.selectedNodeId()));

    // Keyboard Repeat Helpers
    private keyRepeatTimeout: any;
    private keyRepeatInterval: any;
    private currentKey: string | null = null;
    private accelSteps = 1;

    constructor() {
        this.loadData();
    }

    loadData() {
        const relativeTo = this.data.currentTime;
        let list = this.service.getFutureAvailability(this.data.employee.empNumber, relativeTo);
        const current = this.service.getAvailabilityWindow(this.data.employee.empNumber, relativeTo).current;

        if (current && !list.find(x => x.id === current.id)) {
            list = [current, ...list];
        }

        const sorted = this.sortList(list);

        this.originalStatuses = JSON.parse(JSON.stringify(sorted));
        this.currentStatuses.set(JSON.parse(JSON.stringify(sorted)));

        const now = new Date(relativeTo).getTime();
        const threeMonths = 3 * 30 * 24 * 3600 * 1000;
        const start = now - threeMonths;
        const mid = start + (this.rangeMs / 2);
        this.centerTime.set(mid);
    }

    sortList(list: AvailabilityStatus[]) {
        return list.sort((a, b) => new Date(a.effectiveDateTime).getTime() - new Date(b.effectiveDateTime).getTime());
    }

    // View Props
    startRange = computed(() => this.centerTime() - (this.rangeMs / 2));
    endRange = computed(() => this.centerTime() + (this.rangeMs / 2));

    // Current Time Line
    currentTimePos = computed(() => {
        const now = new Date(this.data.currentTime).getTime();
        return this.getPos(now);
    });

    monthMarkers = computed(() => {
        const s = new Date(this.startRange());
        const e = new Date(this.endRange());
        const markers = [];
        let current = new Date(s.getFullYear(), s.getMonth(), 1);

        while (current < e) {
            if (current >= s) {
                markers.push({ date: new Date(current), pos: this.getPos(current.getTime()) });
            }
            current.setMonth(current.getMonth() + 1);
        }
        return markers;
    });

    // Calculate Nodes with Validation State
    visibleNodes = computed(() => {
        const list = this.currentStatuses();
        const now = new Date(this.data.currentTime).getTime();

        const result = list.map((st, i) => {
            const t = new Date(st.effectiveDateTime).getTime();
            let error = '';
            const prev = list[i - 1];

            if (prev && new Date(prev.effectiveDateTime).getTime() === t) {
                error = 'חפיפה: קיימים מספר מצבים באותו זמן בדיוק.';
            } else if (prev && prev.status === st.status) {
                const statusHeb = st.status === 'Available' ? 'פנוי' : 'לא פנוי';
                error = `כפילות: המצב הקודם גם הוא ${statusHeb}.`;
            }

            return { data: st, time: t, pos: this.getPos(t), index: i, error, horizontalOffset: 0, side: 'start' as 'start' | 'end' };
        }).filter(n => n.pos >= -5 && n.pos <= 105);

        // Grouping and Side Logic
        const pastNodes = result.filter(n => n.time < now).sort((a, b) => b.time - a.time); // Closest to Now first
        const futureNodes = result.filter(n => n.time >= now).sort((a, b) => a.time - b.time); // Closest to Now first

        pastNodes.forEach((n, idx) => {
            n.side = (idx % 2 === 0) ? 'start' : 'end';
        });
        futureNodes.forEach((n, idx) => {
            n.side = (idx % 2 === 0) ? 'start' : 'end';
        });

        return result;
    });

    isSaveEnabled = computed(() => {
        if (!this.hasChanges()) return false;
        const list = this.currentStatuses();
        for (let i = 0; i < list.length; i++) {
            const st = list[i];
            const prev = list[i - 1];
            if (prev) {
                if (new Date(prev.effectiveDateTime).getTime() === new Date(st.effectiveDateTime).getTime()) return false;
                if (prev.status === st.status) return false;
            }
        }
        return true;
    });

    getPos(time: number) {
        const total = this.endRange() - this.startRange();
        const val = time - this.startRange();
        return (val / total) * 100;
    }

    getTimeFromPos(percent: number) {
        const total = this.endRange() - this.startRange();
        return this.startRange() + (percent / 100 * total);
    }

    isLocked(s: AvailabilityStatus) {
        return new Date(s.effectiveDateTime).getTime() <= new Date(this.data.currentTime).getTime();
    }

    shiftMonth(dir: number) {
        const m = 30 * 24 * 3600 * 1000;
        this.centerTime.update(c => c + (dir * m));
    }

    addNewNode() {
        const now = new Date(this.data.currentTime).getTime();
        const center = this.centerTime();
        let targetTime = Math.max(now + 3600000, center);
        const coeff = 1000 * 60 * 30;
        targetTime = Math.round(targetTime / coeff) * coeff;
        const iso = new Date(targetTime).toISOString();
        const list = this.currentStatuses();
        const last = list[list.length - 1];
        const newStatus = last && last.status === 'Available' ? 'Not Available' : 'Available';

        const newItem: AvailabilityStatus = {
            id: Math.random().toString(36).substring(2),
            empNumber: this.data.employee.empNumber,
            effectiveDateTime: iso,
            status: newStatus as AvailabilityType,
            description: 'שינוי חדש'
        };

        this.currentStatuses.update(prev => this.sortList([...prev, newItem]));
    }

    deleteNode(id: string) {
        this.currentStatuses.update(prev => prev.filter(x => x.id !== id));
    }

    updateStatus(id: string, newStatus: string) {
        this.currentStatuses.update(prev => prev.map(x => x.id === id ? { ...x, status: newStatus as AvailabilityType } : x));
    }

    updateDesc(id: string, desc: string) {
        this.currentStatuses.update(prev => prev.map(x => x.id === id ? { ...x, description: desc } : x));
    }

    hasChanges() {
        return JSON.stringify(this.originalStatuses) !== JSON.stringify(this.currentStatuses());
    }

    revert() {
        this.currentStatuses.set(JSON.parse(JSON.stringify(this.originalStatuses)));
    }

    save() {
        const list = this.currentStatuses();
        list.forEach(s => this.service.addAvailabilityStatus(s));
        this.originalStatuses = JSON.parse(JSON.stringify(list));
        this.dialogRef.close();
    }

    close() {
        this.stopKeyRepeat();
        this.dialogRef.close();
    }

    selectNode(e: MouseEvent, id: string) {
        e.stopPropagation();
        this.selectedNodeId.set(id);
    }

    // Keyboard Handlers
    handleKeyDown(e: KeyboardEvent) {
        const selId = this.selectedNodeId();
        if (!selId || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;

        // Prevent repeat if same key
        if (this.currentKey === e.key) return;

        // If typing in the input, don't move node
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA') return;

        e.preventDefault();
        this.currentKey = e.key;
        this.accelSteps = 1;
        const useDays = e.shiftKey;

        // Initial Move
        this.moveNode(selId, e.key === 'ArrowUp' ? -1 : 1, 1, useDays);

        // Start Repeat Logic
        this.keyRepeatTimeout = setTimeout(() => {
            this.keyRepeatInterval = setInterval(() => {
                // Acceleration: increase steps up to a limit (e.g. 10 hours at once)
                // If moving by days, acceleration is slower to keep it manageable
                const maxAccel = useDays ? 10 : 20;
                if (this.accelSteps < maxAccel) this.accelSteps += (useDays ? 0.3 : 0.8);
                this.moveNode(selId, e.key === 'ArrowUp' ? -1 : 1, Math.floor(this.accelSteps), useDays);
            }, 60);
        }, 350);
    }

    handleKeyUp(e: KeyboardEvent) {
        if (this.currentKey === e.key) {
            this.stopKeyRepeat();
        }
    }

    private stopKeyRepeat() {
        clearTimeout(this.keyRepeatTimeout);
        clearInterval(this.keyRepeatInterval);
        this.currentKey = null;
        this.accelSteps = 1;
        // Re-sort after keyboard movement ends
        const selId = this.selectedNodeId();
        if (selId) {
            this.currentStatuses.update(list => this.sortList([...list]));
        }
    }

    private moveNode(id: string, direction: number, steps: number = 1, useDays: boolean = false) {
        const list = this.currentStatuses();
        const index = list.findIndex(x => x.id === id);
        if (index === -1 || this.isLocked(list[index])) return;

        const node = list[index];
        const currentTime = new Date(node.effectiveDateTime).getTime();
        const incrementMs = useDays ? (24 * 60 * 60 * 1000) : (30 * 60 * 1000);
        let newTime = currentTime + (direction * steps * incrementMs);

        // Bounds
        const now = new Date(this.data.currentTime).getTime();
        const prevBound = Math.max(now, index > 0 ? new Date(list[index - 1].effectiveDateTime).getTime() : this.startRange());
        const nextBound = index < list.length - 1 ? new Date(list[index + 1].effectiveDateTime).getTime() : this.endRange();

        newTime = Math.max(prevBound, Math.min(newTime, nextBound));

        // Final snap to 30 mins even for days to keep it consistent
        const coeff = 1000 * 60 * 30;
        newTime = Math.round(newTime / coeff) * coeff;

        const newIso = new Date(newTime).toISOString();

        this.currentStatuses.update(curr => {
            const copy = [...curr];
            copy[index] = { ...copy[index], effectiveDateTime: newIso };
            return copy;
        });
    }

    startDrag(e: MouseEvent, node: any) {
        if (this.isLocked(node.data)) return;
        e.preventDefault();
        e.stopPropagation();
        this.draggingObj = node;
    }

    onDrag(e: MouseEvent) {
        if (!this.draggingObj) return;
        const container = e.currentTarget as HTMLElement;
        const rect = container.getBoundingClientRect();
        const relativeY = e.clientY - rect.top;
        let percent = (relativeY / rect.height) * 100;
        let newTime = this.getTimeFromPos(percent);
        const coeff = 1000 * 60 * 30;
        newTime = Math.round(newTime / coeff) * coeff;
        const now = new Date(this.data.currentTime).getTime();
        const list = this.currentStatuses();
        const index = list.findIndex(x => x.id === this.draggingObj.data.id);
        if (index !== -1) {
            const prevBound = Math.max(now, index > 0 ? new Date(list[index - 1].effectiveDateTime).getTime() : this.startRange());
            const nextBound = index < list.length - 1 ? new Date(list[index + 1].effectiveDateTime).getTime() : this.endRange();
            newTime = Math.max(prevBound, Math.min(newTime, nextBound));
            const newIso = new Date(newTime).toISOString();
            this.currentStatuses.update(curr => {
                const copy = [...curr];
                copy[index] = { ...copy[index], effectiveDateTime: newIso };
                return copy;
            });
        }
    }

    stopDrag() {
        if (this.draggingObj) {
            this.currentStatuses.update(list => this.sortList([...list]));
            this.draggingObj = null;
        }
    }
}
