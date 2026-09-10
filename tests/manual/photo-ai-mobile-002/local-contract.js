// Browser-only projection for the isolated gate. Server contract tests remain
// authoritative; this keeps the static bundle independent of the PMP tree.
export function mapLocalExtractionToContract(extraction){
  const confidence=v=>v===null?'Não confirmado':'Duvidoso';
  return {schemaVersion:2,document:{documentType:extraction.documentType,metadata:extraction.metadata,readings:extraction.readings.map(r=>({...r,confidence:confidence(r.value)})),checks:extraction.checks,reports:extraction.reports}};
}
