
import { Button } from '@/components/ui/button';

interface MobileFilterToggleProps {
  showFilters: boolean;
  onToggleFilters: () => void;
}

const MobileFilterToggle = ({ showFilters, onToggleFilters }: MobileFilterToggleProps) => {
  return (
    <div className="lg:hidden mb-6">
      <Button 
        variant="outline"
        className="w-full flex items-center justify-center"
        onClick={onToggleFilters}
      >
        {showFilters ? 'Hide Filters' : 'Show Filters'}
      </Button>
    </div>
  );
};

export default MobileFilterToggle;
