'use client';

import { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  CreditCard, 
  Mail, 
  Phone, 
  Edit3,
  Eye,
  EyeOff
} from 'lucide-react';
import Button from './buttons/Button';

export default function BillingInfo({ 
  billingInfo, 
  isEditable = false,
  onEdit = null,
  className = '' 
}) {
  const [showSensitiveInfo, setShowSensitiveInfo] = useState(false);

  if (!billingInfo) {
    return (
      <div className={`p-4 rounded-lg border ${className}`} style={{ 
        backgroundColor: 'var(--bg-secondary)',
        borderColor: 'var(--border-primary)'
      }}>
        <div className="text-center text-gray-500" style={{ color: 'var(--text-secondary)' }}>
          No billing information available
        </div>
      </div>
    );
  }

  const toggleSensitiveInfo = () => {
    setShowSensitiveInfo(!showSensitiveInfo);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <CreditCard className="w-5 h-5" />
          Billing Information
        </h3>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSensitiveInfo}
            className="flex items-center gap-1"
          >
            {showSensitiveInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showSensitiveInfo ? 'Hide' : 'Show'} Sensitive
          </Button>
          {isEditable && onEdit && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onEdit}
              className="flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </Button>
          )}
        </div>
      </div>

      {/* Billing Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Company Information */}
        <div className="p-4 rounded-lg border" style={{ 
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-secondary)'
        }}>
          <h4 className="font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Building2 className="w-4 h-4" />
            Company Details
          </h4>
          <div className="space-y-2">
            {billingInfo.company_name && (
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Company:</span>
                <span className="ml-2" style={{ color: 'var(--text-primary)' }}>{billingInfo.company_name}</span>
              </div>
            )}
            {billingInfo.tax_id && (
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Tax ID:</span>
                <span className="ml-2 font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                  {showSensitiveInfo ? billingInfo.tax_id : '••••••••'}
                </span>
              </div>
            )}
            {billingInfo.vat_number && (
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>VAT:</span>
                <span className="ml-2 font-mono text-sm" style={{ color: 'var(--text-primary)' }}>
                  {showSensitiveInfo ? billingInfo.vat_number : '••••••••'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Terms */}
        <div className="p-4 rounded-lg border" style={{ 
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-secondary)'
        }}>
          <h4 className="font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <CreditCard className="w-4 h-4" />
            Payment Terms
          </h4>
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Terms:</span>
              <span className="ml-2" style={{ color: 'var(--text-primary)' }}>
                {billingInfo.payment_terms?.replace('_', ' ').toUpperCase() || 'Not specified'}
              </span>
            </div>
            {billingInfo.custom_payment_terms && (
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Custom:</span>
                <span className="ml-2" style={{ color: 'var(--text-primary)' }}>{billingInfo.custom_payment_terms}</span>
              </div>
            )}
            <div>
              <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Currency:</span>
              <span className="ml-2" style={{ color: 'var(--text-primary)' }}>{billingInfo.currency || 'USD'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Address */}
      {billingInfo.billing_address && (
        <div className="p-4 rounded-lg border" style={{ 
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-secondary)'
        }}>
          <h4 className="font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <MapPin className="w-4 h-4" />
            Billing Address
          </h4>
          <div className="space-y-1">
            {billingInfo.billing_address.street && (
              <div style={{ color: 'var(--text-primary)' }}>{billingInfo.billing_address.street}</div>
            )}
            <div style={{ color: 'var(--text-primary)' }}>
              {[
                billingInfo.billing_address.city,
                billingInfo.billing_address.state,
                billingInfo.billing_address.postal_code
              ].filter(Boolean).join(', ')}
            </div>
            {billingInfo.billing_address.country && (
              <div style={{ color: 'var(--text-primary)' }}>{billingInfo.billing_address.country}</div>
            )}
          </div>
        </div>
      )}

      {/* Contact Information */}
      {billingInfo.billing_contact && (
        <div className="p-4 rounded-lg border" style={{ 
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-secondary)'
        }}>
          <h4 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
            Billing Contact
          </h4>
          <div className="space-y-2">
            {billingInfo.billing_contact.name && (
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Name:</span>
                <span className="ml-2" style={{ color: 'var(--text-primary)' }}>{billingInfo.billing_contact.name}</span>
              </div>
            )}
            {billingInfo.billing_contact.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Email:</span>
                <span className="ml-2" style={{ color: 'var(--text-primary)' }}>{billingInfo.billing_contact.email}</span>
              </div>
            )}
            {billingInfo.billing_contact.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Phone:</span>
                <span className="ml-2" style={{ color: 'var(--text-primary)' }}>{billingInfo.billing_contact.phone}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Additional Information */}
      {(billingInfo.invoice_email || billingInfo.billing_notes) && (
        <div className="p-4 rounded-lg border" style={{ 
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-secondary)'
        }}>
          <h4 className="font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
            Additional Information
          </h4>
          <div className="space-y-2">
            {billingInfo.invoice_email && (
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Invoice Email:</span>
                <span className="ml-2" style={{ color: 'var(--text-primary)' }}>{billingInfo.invoice_email}</span>
              </div>
            )}
            {billingInfo.billing_notes && (
              <div>
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>Notes:</span>
                <div className="mt-1 text-sm" style={{ color: 'var(--text-primary)' }}>{billingInfo.billing_notes}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
