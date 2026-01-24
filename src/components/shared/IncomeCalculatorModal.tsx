'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatCurrency } from '@/utils/currency';

interface IncomeCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIncome?: number;
  onSave: (totalIncome: number) => Promise<void>;
  isLoading: boolean;
  hasExistingIncome: boolean;
}

interface IncomeData {
  baseSalary: number;
  allowance: number;
  bonus: number;
  otherIncome: number;
  
  pagibig: number;
  sss: number;
  philhealth: number;
  tax: number;
  otherDeductions: number;
}

export function IncomeCalculatorModal({
  isOpen,
  onClose,
  initialIncome = 0,
  onSave,
  isLoading,
  hasExistingIncome,
}: IncomeCalculatorModalProps) {
  const [formData, setFormData] = useState<IncomeData>({
    baseSalary: 0,
    allowance: 0,
    bonus: 0,
    otherIncome: 0,
    pagibig: 0,
    sss: 0,
    philhealth: 0,
    tax: 0,
    otherDeductions: 0,
  });

  const [showDeductions, setShowDeductions] = useState(false);

  useEffect(() => {
    if (isOpen && initialIncome > 0) {
      setFormData(prev => ({
        ...prev,
        baseSalary: initialIncome,
      }));
    }
  }, [isOpen, initialIncome]);

  const grossIncome =
    formData.baseSalary +
    formData.allowance +
    formData.bonus +
    formData.otherIncome;

  const totalDeductions =
    formData.pagibig +
    formData.sss +
    formData.philhealth +
    formData.tax +
    formData.otherDeductions;

  const netIncome = grossIncome - totalDeductions;

  const handleInputChange = (field: keyof IncomeData, value: string) => {
    const numValue = parseFloat(value) || 0;
    setFormData(prev => ({
      ...prev,
      [field]: Math.max(0, numValue),
    }));
  };

  const handleSave = async () => {
    if (grossIncome <= 0) {
      alert('Please enter at least one income source');
      return;
    }

    await onSave(netIncome);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={hasExistingIncome ? 'Edit Monthly Income' : 'Add Monthly Income'}
      size="lg"
    >
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="font-semibold text-slate-800">Income Sources</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Base Salary"
              type="number"
              value={formData.baseSalary}
              onChange={(e) => handleInputChange('baseSalary', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
            <Input
              label="Allowance (Housing, Meal, etc.)"
              type="number"
              value={formData.allowance}
              onChange={(e) => handleInputChange('allowance', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
            <Input
              label="Bonus"
              type="number"
              value={formData.bonus}
              onChange={(e) => handleInputChange('bonus', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
            <Input
              label="Other Income"
              type="number"
              value={formData.otherIncome}
              onChange={(e) => handleInputChange('otherIncome', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
            />
          </div>

          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="flex justify-between items-center">
              <span className="font-medium text-emerald-900">Gross Income</span>
              <span className="text-xl font-semibold text-emerald-900">
                {formatCurrency(grossIncome)}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <button
            type="button"
            onClick={() => setShowDeductions(!showDeductions)}
            className="flex items-center gap-2 pb-2 border-b border-slate-200 w-full hover:opacity-75 transition-opacity"
          >
            <svg
              className={`w-5 h-5 text-rose-600 transition-transform ${
                showDeductions ? 'rotate-180' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 14l-7 7m0 0l-7-7m7 7V3"
              />
            </svg>
            <h3 className="font-semibold text-slate-800">
              Optional Deductions {showDeductions ? '(Click to collapse)' : '(Click to expand)'}
            </h3>
          </button>

          {showDeductions && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Pag-IBIG"
                  type="number"
                  value={formData.pagibig}
                  onChange={(e) => handleInputChange('pagibig', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  helperText="Pag-IBIG Fund contribution"
                />
                <Input
                  label="SSS"
                  type="number"
                  value={formData.sss}
                  onChange={(e) => handleInputChange('sss', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  helperText="Social Security System"
                />
                <Input
                  label="PhilHealth"
                  type="number"
                  value={formData.philhealth}
                  onChange={(e) => handleInputChange('philhealth', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  helperText="Philippine Health Insurance"
                />
                <Input
                  label="Income Tax"
                  type="number"
                  value={formData.tax}
                  onChange={(e) => handleInputChange('tax', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  helperText="Withholding Tax / BIR"
                />
                <Input
                  label="Other Deductions"
                  type="number"
                  value={formData.otherDeductions}
                  onChange={(e) => handleInputChange('otherDeductions', e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  helperText="Loans, insurance, etc."
                />
              </div>

              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200">
                <div className="space-y-2">
                  {formData.pagibig > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-rose-900">Pag-IBIG:</span>
                      <span className="font-medium text-rose-900">
                        {formatCurrency(formData.pagibig)}
                      </span>
                    </div>
                  )}
                  {formData.sss > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-rose-900">SSS:</span>
                      <span className="font-medium text-rose-900">
                        {formatCurrency(formData.sss)}
                      </span>
                    </div>
                  )}
                  {formData.philhealth > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-rose-900">PhilHealth:</span>
                      <span className="font-medium text-rose-900">
                        {formatCurrency(formData.philhealth)}
                      </span>
                    </div>
                  )}
                  {formData.tax > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-rose-900">Tax:</span>
                      <span className="font-medium text-rose-900">
                        {formatCurrency(formData.tax)}
                      </span>
                    </div>
                  )}
                  {formData.otherDeductions > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-rose-900">Other:</span>
                      <span className="font-medium text-rose-900">
                        {formatCurrency(formData.otherDeductions)}
                      </span>
                    </div>
                  )}
                  {totalDeductions > 0 && (
                    <div className="flex justify-between border-t border-rose-200 pt-2 mt-2">
                      <span className="font-semibold text-rose-900">Total Deductions:</span>
                      <span className="font-bold text-rose-900">
                        {formatCurrency(totalDeductions)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-5 rounded-lg bg-gradient-to-r from-slate-50 to-slate-100 border-2 border-slate-300">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-2">
            Net Income (After Deductions)
          </p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-3xl font-bold text-slate-800">
                {formatCurrency(netIncome)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Gross: {formatCurrency(grossIncome)} - Deductions: {formatCurrency(totalDeductions)}
              </p>
            </div>
            <div className="text-right">
              {totalDeductions > 0 && (
                <p className="text-xs text-slate-600">
                  Deduction Rate: {((totalDeductions / grossIncome) * 100).toFixed(1)}%
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-slate-200">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={isLoading}
            disabled={grossIncome <= 0}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {hasExistingIncome ? 'Update Income' : 'Add Income'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}