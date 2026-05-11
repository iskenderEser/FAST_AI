'use client';

import { Button } from '../../ui/Button'; // import { Button } from '@/components/ui/Button';
import { Pill } from '../../ui/Pill';
import { Card, CardHeader, CardTitle, CardContent, CardActions } from '../../ui/Card'; // import { Card, CardHeader, CardTitle, CardContent, CardActions } from '@/components/ui/Card';

export function StyleCard({ 
  style, 
  isActive, 
  cprText, 
  isLoading, 
  btnState, 
  onConvert, 
  onTextChange, 
  onSave, 
  isSaving, 
  textareaRef 
}) {
  const getBtnLabel = () => {
    switch (btnState) {
      case 'loading': return '⏳ Üretiliyor...';
      case 'success': return '✅ Üretildi!';
      case 'error':   return '❌ Hata!';
      default:        return 'CPR Üret';
    }
  };

  const getBtnVariant = () => {
    switch (btnState) {
      case 'success': return 'primary';
      case 'error':   return 'secondary';
      default:        return 'ghost';
    }
  };

  return (
    <Card variant="default" hoverable={true} className="style-card">
      
      <CardHeader>
        <div className="style-card-header">
          <div>
            <CardTitle>{style.title}</CardTitle>
            <Pill variant="learning">
              <span className="icon">{style.badgeIcon}</span>
              <span>{style.badgeText}</span>
            </Pill>
          </div>
          <Button 
            variant={getBtnVariant()} 
            size="small" 
            onClick={onConvert} 
            disabled={isLoading || !isActive}
          >
            {getBtnLabel()}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="textarea-wrapper">
          <textarea
            ref={textareaRef}
            className="styled-cpr-area styled-cpr-area--full"
            value={cprText}
            onChange={onTextChange}
            placeholder="CPR Üret butonuna basın."
          />
        </div>
      </CardContent>
      {cprText && (
        <CardActions>
          <Button variant="primary" size="small" onClick={onSave} disabled={isSaving}>
            {isSaving ? '⏳ Kaydediliyor...' : '📄 PDF İndir & Arşivle'}
          </Button>
        </CardActions>
      )}
    </Card>
  );
}