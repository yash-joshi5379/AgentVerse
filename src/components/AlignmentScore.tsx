interface AlignmentScoreProps {
  score: number;
  size?: 'small' | 'large';
}

export function AlignmentScore({ score, size = 'small' }: AlignmentScoreProps) {
  const height = size === 'large' ? 'h-8' : 'h-3';
  
  return (
    <div className="flex items-center gap-3 w-full">
      <div className={`flex-1 bg-muted rounded-full overflow-hidden ${height} relative`}>
        <div 
          className="bg-gradient-to-r from-primary to-secondary h-full rounded-full transition-all duration-500 ease-out shadow-sm"
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="flex items-center gap-1 min-w-[60px]">
        <span className={`${size === 'large' ? 'text-2xl' : 'text-sm'} text-primary`}>
          {score}%
        </span>
        {size === 'large' && (
          <span className="text-sm text-muted-foreground">match</span>
        )}
      </div>
    </div>
  );
}
