<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>訂單確認通知</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Microsoft JhengHei', 'PingFang TC', Arial, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
            <td align="center" style="padding: 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header with Logo -->
                    <tr>
                        <td bgcolor="#f0f4ff" align="center" style="padding: 30px 20px;">
                            <img src="{{ asset('logo2.png') }}" alt="蘭光電動機車" style="max-width: 200px; height: auto; display: block; margin: 0 auto;">
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td bgcolor="#f9fafb" style="padding: 40px 30px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.8;">
                                            親愛的 {{ $booking->name }} 您好：
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.8;">
                                            感謝您的預訂。
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.8;">
                                            {{ \Carbon\Carbon::parse($booking->booking_date)->format('Y') }}年{{ \Carbon\Carbon::parse($booking->booking_date)->format('n') }}月{{ \Carbon\Carbon::parse($booking->booking_date)->format('j') }}日 車輛訂單已確認成立。
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.8;">
                                            請依約定時間前來取車，若逾時且現場已有其他訂單，<br>
                                            將依當日訂單順序安排接駁，訂單順序將順延，敬請見諒。
                                        </p>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.8;">
                                            蘭光電動機車祝您旅途愉快！
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding-top: 20px; border-top: 1px solid #e5e7eb;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td align="center" style="padding: 10px 0;">
                                        <p style="margin: 5px 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">此郵件由蘭光電動機車系統自動發送</p>
                                        <p style="margin: 5px 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">發送時間：{{ now()->format('Y-m-d H:i:s') }}</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
