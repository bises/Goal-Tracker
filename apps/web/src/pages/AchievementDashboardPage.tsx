import { DailyFocusList } from '../components/DailyFocusList';
import { GoalsProgress } from '../components/GoalsProgress';
import { TodayProgressCard } from '../components/TodayProgressCard';

export const AchievementDashboardPage = () => {
  return (
    <div className="min-h-screen px-2 pb-20 pt-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <section className="min-h-[200px]">
          <TodayProgressCard />
        </section>

        <section className="min-h-[200px]">
          <DailyFocusList />
        </section>

        <section>
          <GoalsProgress />
        </section>
      </div>
    </div>
  );
};
