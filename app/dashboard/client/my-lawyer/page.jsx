"use client";

import { useState, useEffect } from "react";
import { useAppSelector } from "@/store";
import { Briefcase, Mail, Loader2 } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { useRouter } from "next/navigation";

const API =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const tok = () =>
  typeof window !== "undefined"
    ? localStorage.getItem("token")
    : null;

const hdrs = () => ({
  "Content-Type": "application/json",
  ...(tok() ? { Authorization: `Bearer ${tok()}` } : {}),
});

export default function MyLawyer() {
  const { user, role } = useAppSelector((s) => s.auth);
  const router = useRouter();

  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      try {
        const res = await fetch(
          `${API}/api/cases/lawyers`,
          {
            headers: hdrs(),
            credentials: "include",
          }
        );

        const data = await res.json();

        if (res.ok && data.success) {
          setLawyers(data.lawyers || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">
          My Lawyers
        </h2>
        <p className="text-sm text-muted-foreground">
          Your assigned legal representatives
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : lawyers.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            No lawyer assigned yet. Create a case to get matched with a lawyer.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {lawyers.map((lawyer) => (
            <div
              key={lawyer._id}
              className="bg-card rounded-xl border border-border p-6 space-y-4 max-w-lg"
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-8 w-8 text-primary" />
                </div>

                <div>
                  <p className="font-bold text-lg">
                    {lawyer.name || "Unnamed Lawyer"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {lawyer.lawyerProfile?.specializations?.[0] ||
                      "Legal Representative"}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {lawyer.email}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  onClick={() =>
                    router.push(
                      `/dashboard/${role}/messages?contact=${lawyer._id}`
                    )
                  }
                >
                  Send Message
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    router.push(
                      `/dashboard/${role}/video-calls?contact=${lawyer._id}`
                    )
                  }
                >
                  Video Call
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}