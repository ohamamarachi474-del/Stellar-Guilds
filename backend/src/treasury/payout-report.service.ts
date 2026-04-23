import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayoutReportService {
  constructor(private readonly prisma: PrismaService) {}

  async generateHtml(guildId: string): Promise<string> {
    // Fetch guild info
    const guild = await this.prisma.guild.findUnique({
      where: { id: guildId },
      select: {
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!guild) {
      throw new Error('Guild not found');
    }

    // Fetch payouts with related data
    const payouts = await this.prisma.bountyPayout.findMany({
      where: {
        bounty: {
          guildId,
        },
      },
      include: {
        bounty: {
          select: {
            title: true,
          },
        },
        toUser: {
          select: {
            username: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate summary stats
    const totalPayouts = payouts.length;
    const totalAmount = payouts.reduce((sum: number, payout: any) => sum + Number(payout.amount), 0);
    const completedPayouts = payouts.filter((p: any) => p.status === 'SENT').length;

    // Generate HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payout Report - ${guild.name}</title>
    <style>
        @media print {
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { max-width: 100px; max-height: 100px; }
            .summary { margin: 20px 0; padding: 10px; background-color: #f5f5f5; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: bold; }
            .total { font-weight: bold; }
            .status-sent { color: green; }
            .status-pending { color: orange; }
            .status-failed { color: red; }
        }
    </style>
</head>
<body>
    <div class="header">
        ${guild.avatarUrl ? `<img src="${guild.avatarUrl}" alt="${guild.name} Logo" class="logo"><br>` : ''}
        <h1>${guild.name} - Payout Report</h1>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
    </div>

    <div class="summary">
        <h2>Summary</h2>
        <p><strong>Total Payouts:</strong> ${totalPayouts}</p>
        <p><strong>Completed Payouts:</strong> ${completedPayouts}</p>
        <p><strong>Total Amount:</strong> ${totalAmount.toFixed(2)} STELLAR</p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Date</th>
                <th>User</th>
                <th>Bounty</th>
                <th>Amount</th>
                <th>Token</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            ${payouts.map(payout => `
                <tr>
                    <td>${payout.createdAt.toLocaleDateString()}</td>
                    <td>${payout.toUser.firstName} ${payout.toUser.lastName} (${payout.toUser.username})</td>
                    <td>${payout.bounty.title}</td>
                    <td>${Number(payout.amount).toFixed(2)}</td>
                    <td>${payout.token}</td>
                    <td class="status-${payout.status.toLowerCase()}">${payout.status}</td>
                </tr>
            `).join('')}
        </tbody>
    </table>
</body>
</html>`;

    return html;
  }
}