import { Shield, Briefcase, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const roles = [
  { value: 'admin', label: 'Admin', icon: Shield, description: 'System administrator', gradient: 'gradient-admin' },
  { value: 'client', label: 'Client', icon: Users, description: 'Client seeking legal help', gradient: 'gradient-client' },
  { value: 'lawyer', label: 'Lawyer', icon: Briefcase, description: 'Legal professional', gradient: 'gradient-lawyer' },
];

const RoleSelector = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      {roles.map((role) => {
        const Icon = role.icon;
        const selected = value === role.value;

        return (
          <button
            key={role.value}
            type="button"
            onClick={() => onChange(role.value)}
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer',
              selected
                ? 'border-primary bg-primary/5 shadow-glow'
                : 'border-border hover:border-primary/40 bg-card'
            )}
          >
            <div className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              selected ? role.gradient : 'bg-muted'
            )}>
              <Icon className={cn(
                'w-5 h-5',
                selected ? 'text-primary-foreground' : 'text-muted-foreground'
              )} />
            </div>
            <span className={cn(
              'text-xs font-medium',
              selected ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {role.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default RoleSelector;