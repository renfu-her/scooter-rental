<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>線上預約確認</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Microsoft JhengHei', 'PingFang TC', Arial, sans-serif; background-color: #f3f4f6;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
            <td align="center" style="padding: 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <!-- Header -->
                    <tr>
                        <td bgcolor="#14b8a6" align="center" style="padding: 20px;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: bold;">蘭光電動機車 - 線上預約確認</h1>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td bgcolor="#f9fafb" style="padding: 30px;">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <!-- 姓名 -->
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 5px;">
                                                    <span style="font-weight: bold; color: #374151; font-size: 14px;">姓名：</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px;">
                                                        <tr>
                                                            <td style="padding: 10px; color: #6b7280; font-size: 14px;">{{ $data['name'] }}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- LINE ID -->
                                @if(!empty($data['lineId']))
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 5px;">
                                                    <span style="font-weight: bold; color: #374151; font-size: 14px;">LINE ID：</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px;">
                                                        <tr>
                                                            <td style="padding: 10px; color: #6b7280; font-size: 14px;">{{ $data['lineId'] }}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                @endif
                                
                                @if(!empty($data['phone']))
                                <!-- 聯絡電話 -->
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 5px;">
                                                    <span style="font-weight: bold; color: #374151; font-size: 14px;">聯絡電話：</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px;">
                                                        <tr>
                                                            <td style="padding: 10px; color: #6b7280; font-size: 14px;">{{ $data['phone'] }}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                @endif
                                
                                <!-- 所需租車類型/數量 -->
                                @if(!empty($data['scooters']) && is_array($data['scooters']))
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 5px;">
                                                    <span style="font-weight: bold; color: #374151; font-size: 14px;">所需租車類型/數量：</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px;">
                                                        <tr>
                                                            <td style="padding: 10px; color: #6b7280; font-size: 14px;">
                                                                @foreach($data['scooters'] as $scooter)
                                                                    {{ $scooter['model'] }} x {{ $scooter['count'] }}<br>
                                                                @endforeach
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                @endif
                                
                                <!-- 預約日期 -->
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 5px;">
                                                    <span style="font-weight: bold; color: #374151; font-size: 14px;">預約日期：</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px;">
                                                        <tr>
                                                            <td style="padding: 10px; color: #6b7280; font-size: 14px;">{{ $data['appointmentDate'] ?? $data['date'] ?? '-' }}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- 結束日期 -->
                                @if(!empty($data['endDate']))
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 5px;">
                                                    <span style="font-weight: bold; color: #374151; font-size: 14px;">結束日期：</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px;">
                                                        <tr>
                                                            <td style="padding: 10px; color: #6b7280; font-size: 14px;">{{ $data['endDate'] }}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                @endif
                                
                                <!-- 船運公司 -->
                                @if(!empty($data['shippingCompany']))
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 5px;">
                                                    <span style="font-weight: bold; color: #374151; font-size: 14px;">船運公司：</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px;">
                                                        <tr>
                                                            <td style="padding: 10px; color: #6b7280; font-size: 14px;">{{ $data['shippingCompany'] }}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                @endif
                                
                                <!-- 船班時間（來） -->
                                @if(!empty($data['shipArrivalTime']))
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 5px;">
                                                    <span style="font-weight: bold; color: #374151; font-size: 14px;">船班時間（來）：</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px;">
                                                        <tr>
                                                            <td style="padding: 10px; color: #6b7280; font-size: 14px;">{{ $data['shipArrivalTime'] }}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                @endif
                                
                                <!-- 人數 -->
                                @if(!empty($data['adults']) || !empty($data['children']))
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 5px;">
                                                    <span style="font-weight: bold; color: #374151; font-size: 14px;">人數：</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px;">
                                                        <tr>
                                                            <td style="padding: 10px; color: #6b7280; font-size: 14px;">
                                                                @if(!empty($data['adults']))
                                                                    大人：{{ $data['adults'] }} 人
                                                                @endif
                                                                @if(!empty($data['adults']) && !empty($data['children']))
                                                                    <br>
                                                                @endif
                                                                @if(!empty($data['children']))
                                                                    小孩（12歲以下）：{{ $data['children'] }} 人
                                                                @endif
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                @endif
                                
                                @if(!empty($data['note']))
                                <!-- 備註 -->
                                <tr>
                                    <td style="padding-bottom: 20px;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td style="padding-bottom: 5px;">
                                                    <span style="font-weight: bold; color: #374151; font-size: 14px;">備註：</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td>
                                                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 4px;">
                                                        <tr>
                                                            <td style="padding: 10px; color: #6b7280; font-size: 14px; white-space: pre-wrap; word-wrap: break-word;">{{ $data['note'] }}</td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                @endif
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="padding-top: 20px; border-top: 1px solid #e5e7eb;">
                                        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                            <tr>
                                                <td align="center" style="padding: 10px 0;">
                                                    <p style="margin: 5px 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">此郵件由蘭光電動機車網站線上預約系統自動發送</p>
                                                    <p style="margin: 5px 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">發送時間：{{ now()->format('Y-m-d H:i:s') }}</p>
                                                    <p style="margin: 5px 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">預約完成後，我們將有專人與您電話聯繫確認詳情。</p>
                                                </td>
                                            </tr>
                                        </table>
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
