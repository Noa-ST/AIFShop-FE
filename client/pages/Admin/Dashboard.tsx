import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  Package,
  FolderTree,
  TrendingUp,
  Activity,
  DollarSign,
} from "lucide-react";

export default function AdminDashboard() {
  // Mock data - replace with actual API calls
  const stats = [
    {
      title: "Total Users",
      value: "1,234",
      change: "+12%",
      changeType: "positive" as const,
      icon: Users,
    },
    {
      title: "Total Products",
      value: "5,678",
      change: "+8%",
      changeType: "positive" as const,
      icon: Package,
    },
    {
      title: "Global Categories",
      value: "45",
      change: "+2",
      changeType: "positive" as const,
      icon: FolderTree,
    },
    {
      title: "Revenue",
      value: "$12,345",
      change: "+15%",
      changeType: "positive" as const,
      icon: DollarSign,
    },
  ];

  const recentActivities = [
    {
      id: 1,
      action: "New user registered",
      time: "2 minutes ago",
      type: "user",
    },
    {
      id: 2,
      action: "Product added to category",
      time: "5 minutes ago",
      type: "product",
    },
    {
      id: 3,
      action: "Global category updated",
      time: "10 minutes ago",
      type: "category",
    },
    { id: 4, action: "Order completed", time: "15 minutes ago", type: "order" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Dashboard Overview
        </h2>
        <p className="text-muted-foreground">
          Welcome to the admin dashboard. Here's what's happening with your
          platform.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                <span
                  className={
                    stat.changeType === "positive"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {stat.change}
                </span>{" "}
                from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest actions across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-4">
                  <div className="flex h-2 w-2 rounded-full bg-blue-600" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer">
              <FolderTree className="h-4 w-4" />
              <span className="text-sm">Manage Global Categories</span>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer">
              <Users className="h-4 w-4" />
              <span className="text-sm">View All Users</span>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer">
              <Package className="h-4 w-4" />
              <span className="text-sm">Review Products</span>
            </div>
            <div className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm">View Analytics</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
