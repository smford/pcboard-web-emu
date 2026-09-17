/**
 * Authentic PCBoard BBS screens and ANSI graphics.
 * Uses Code Page 437 box-drawing and shading characters.
 */

export const ANSI_CLS = '\x1b[2J\x1b[H';

export const PCBOARD_HEADER = `
\x1b[1;36m╔══════════════════════════════════════════════════════════════════════════════╗
\x1b[1;36m║ \x1b[1;33mPCBoard (R) Version 15.22/i386 \x1b[1;30m- \x1b[1;37mClark Development Company, Inc.            \x1b[1;36m║
\x1b[1;36m║ \x1b[1;32mMulti-Node BBS Software        \x1b[1;30m- \x1b[0;36m(C) Copyright 1983-1995 All Rights Reserved \x1b[1;36m║
\x1b[1;36m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m
`;

export const BBS_WELCOME_SCREEN = `
\x1b[2J\x1b[H
\x1b[1;34m╔══════════════════════════════════════════════════════════════════════════════╗
\x1b[1;34m║ \x1b[1;33m░▒▓███████╗  ██████╗██████╗  ██████╗  █████╗ ██████╗ ██████╗ ░▒▓\x1b[1;34m           ║
\x1b[1;34m║ \x1b[1;33m░▒▓██╔════╝ ██╔════╝██╔══██╗██╔═══██╗██╔══██╗██╔══██╗██╔══██╗░▒▓\x1b[1;34m           ║
\x1b[1;34m║ \x1b[1;37m░▒▓███████╗ ██║     ██████╔╝██║   ██║███████║██████╔╝██║  ██║░▒▓\x1b[1;34m           ║
\x1b[1;34m║ \x1b[1;37m░▒▓╚════██║ ██║     ██╔══██╗██║   ██║██╔══██║██╔══██╗██║  ██║░▒▓\x1b[1;34m           ║
\x1b[1;34m║ \x1b[1;36m░▒▓███████║ ╚██████╗██████╔╝╚██████╔╝██║  ██║██║  ██║██████╔╝░▒▓\x1b[1;34m           ║
\x1b[1;34m║ \x1b[1;36m░▒▓╚══════╝  ╚═════╝╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ░▒▓\x1b[1;34m           ║
\x1b[1;34m╠══════════════════════════════════════════════════════════════════════════════╣
\x1b[1;34m║  \x1b[1;37mWelcome to: \x1b[1;33mTHE METROPOLIS SYSTEM \x1b[1;30m- \x1b[1;32mPCBoard BBS v15.22 / Node 1              \x1b[1;34m║
\x1b[1;34m║  \x1b[0;37mSysOps: \x1b[1;35mFred Clark \x1b[0;37m& \x1b[1;35mSmford       \x1b[1;30m| \x1b[0;37mRunning on 486DX4-100 / 32MB RAM     \x1b[1;34m║
\x1b[1;34m║  \x1b[0;37mModem: \x1b[1;32mUSRobotics Courier V.34 Dual Standard 28.8k bps (V.42bis / MNP5)     \x1b[1;34m║
\x1b[1;34m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m
`;

export const BBS_MOTD = `
\x1b[1;33m==============================================================================
\x1b[1;37m                  SYSTEM NEWS & MESSAGE OF THE DAY (MOTD)
\x1b[1;33m==============================================================================
\x1b[0;36m * \x1b[1;37mWelcome to all new and returning callers!
\x1b[0;36m * \x1b[0;37mNode 1 upgraded with high-speed USR V.34 modem.
\x1b[0;36m * \x1b[0;37mNew Door games installed: \x1b[1;33mLegend of the Red Dragon \x1b[0;37mand \x1b[1;32mTradeWars 2002\x1b[0;37m!
\x1b[0;36m * \x1b[0;37mSite Reliability Notice: Automated backups run nightly at 04:00 AM EST.
\x1b[0;36m * \x1b[0;37mFile Section: Latest DOS Shareware and ANSI art packs uploaded today!
\x1b[1;33m==============================================================================\x1b[0m
`;

export const MAIN_MENU = `
\x1b[1;34m╔═════════════════════════════ \x1b[1;33mPCBOARD MAIN MENU \x1b[1;34m═════════════════════════════╗
\x1b[1;34m║                                                                            ║
\x1b[1;34m║   \x1b[1;32m-- [M]ESSAGES --           -- [F]ILES --              -- [S]YSTEM --     \x1b[1;34m║
\x1b[1;34m║   \x1b[1;37m[M] \x1b[0;37mRead Messages          \x1b[1;37m[F] \x1b[0;37mFile Directories       \x1b[1;37m[B] \x1b[0;37mBulletins Menu     \x1b[1;34m║
\x1b[1;34m║   \x1b[1;37m[E] \x1b[0;37mEnter New Message      \x1b[1;37m[D] \x1b[0;37mDownload File          \x1b[1;37m[W] \x1b[0;37mWho's Online       \x1b[1;34m║
\x1b[1;34m║   \x1b[1;37m[J] \x1b[0;37mJoin Conference        \x1b[1;37m[U] \x1b[0;37mUpload File (Sim)      \x1b[1;37m[C] \x1b[0;37mChat with SysOp    \x1b[1;34m║
\x1b[1;34m║   \x1b[1;37m[Q] \x1b[0;37mQuick Scan New Mail    \x1b[1;37m[N] \x1b[0;37mNew Files List         \x1b[1;37m[V] \x1b[0;37mView User Stats    \x1b[1;34m║
\x1b[1;34m║                                                                            ║
\x1b[1;34m║   \x1b[1;32m-- [O]NLINE DOORS --       -- [U]TILITIES --          -- [E]XIT --       \x1b[1;34m║
\x1b[1;34m║   \x1b[1;37m[O] \x1b[0;37mOpen Door Games        \x1b[1;37m[X] \x1b[0;37mToggle Expert Mode     \x1b[1;37m[G] \x1b[0;37mGoodbye (Logoff)   \x1b[1;34m║
\x1b[1;34m║   \x1b[1;37m[L] \x1b[0;37mLegend Red Dragon      \x1b[1;37m[H] \x1b[0;37mHelp / Command List    \x1b[1;37m[DOS] \x1b[0;37mReturn to DOS    \x1b[1;34m║
\x1b[1;34m║   \x1b[1;37m[T] \x1b[0;37mTradeWars 2002         \x1b[1;37m[S] \x1b[0;37mSysOp Status Screen    \x1b[1;37m[?] \x1b[0;37mShort Menu         \x1b[1;34m║
\x1b[1;34m║                                                                            ║
\x1b[1;34m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m
`;

export const BULLETINS_LIST = `
\x1b[1;36m╔══════════════════════════════════════════════════════════════════════════════╗
\x1b[1;36m║                          \x1b[1;33mPCBOARD SYSTEM BULLETINS                            \x1b[1;36m║
\x1b[1;36m╠══════════════════════════════════════════════════════════════════════════════╣
\x1b[1;36m║  \x1b[1;37m[1] \x1b[0;37mSystem Hardware & Node Configuration                                    \x1b[1;36m║
\x1b[1;36m║  \x1b[1;37m[2] \x1b[0;37mBBS Rules & Acceptable Use Policy                                       \x1b[1;36m║
\x1b[1;36m║  \x1b[1;37m[3] \x1b[0;37mSite Reliability & Infrastructure Architecture (SRE Report)             \x1b[1;36m║
\x1b[1;36m║  \x1b[1;37m[4] \x1b[0;37mHistory of PCBoard & Clark Development Company                          \x1b[1;36m║
\x1b[1;36m║  \x1b[1;37m[0] \x1b[0;37mReturn to Main Menu                                                     \x1b[1;36m║
\x1b[1;36m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m
`;

export const WHO_IS_ONLINE = `
\x1b[1;35m╔══════════════════════════════════════════════════════════════════════════════╗
\x1b[1;35m║                          \x1b[1;37mWHO IS ONLINE - ACTIVE NODES                        \x1b[1;35m║
\x1b[1;35m╠══════╦══════════════════════╦══════════════════╦══════════════╦══════════════╣
\x1b[1;35m║ \x1b[1;33mNode \x1b[1;35m║ \x1b[1;33mUser Name            \x1b[1;35m║ \x1b[1;33mLocation / City  \x1b[1;35m║ \x1b[1;33mBaud Rate    \x1b[1;35m║ \x1b[1;33mCurrent Activity\x1b[1;35m║
\x1b[1;35m╠══════╬══════════════════════╬══════════════════╬══════════════╬══════════════╣
\x1b[1;35m║  \x1b[1;32m01  \x1b[1;35m║ \x1b[1;37m{CURRENT_USER}       \x1b[1;35m║ \x1b[0;37mLocal / Web      \x1b[1;35m║ \x1b[1;36m28800 V.34   \x1b[1;35m║ \x1b[1;33mMain Menu    \x1b[1;35m║
\x1b[1;35m║  \x1b[1;32m02  \x1b[1;35m║ \x1b[1;37mAcid Burn            \x1b[1;35m║ \x1b[0;37mNew York, NY     \x1b[1;35m║ \x1b[1;36m14400 V.32   \x1b[1;35m║ \x1b[1;33mDoor: LORD   \x1b[1;35m║
\x1b[1;35m║  \x1b[1;32m03  \x1b[1;35m║ \x1b[1;37mCrash Override       \x1b[1;35m║ \x1b[0;37mSeattle, WA      \x1b[1;35m║ \x1b[1;36m28800 V.34   \x1b[1;35m║ \x1b[1;33mDownloading  \x1b[1;35m║
\x1b[1;35m║  \x1b[1;32m04  \x1b[1;35m║ \x1b[1;37mThe Prophet          \x1b[1;35m║ \x1b[0;37mSan Jose, CA     \x1b[1;35m║ \x1b[1;36m14400 V.32   \x1b[1;35m║ \x1b[1;33mMessage Base \x1b[1;35m║
\x1b[1;35m║  \x1b[1;30m05  \x1b[1;35m║ \x1b[1;30m[ Waiting for Call ] \x1b[1;35m║ \x1b[1;30m--               \x1b[1;35m║ \x1b[1;30mRing Ready   \x1b[1;35m║ \x1b[1;30mWaiting...   \x1b[1;35m║
\x1b[1;35m╚══════╩══════════════════════╩══════════════════╩══════════════╩══════════════╝\x1b[0m
`;

export const FILE_DIRECTORY = `
\x1b[1;32m╔══════════════════════════════════════════════════════════════════════════════╗
\x1b[1;32m║                        \x1b[1;37mCONFERENCE 0 - FILE DIRECTORIES                       \x1b[1;32m║
\x1b[1;32m╠══════════════╦══════════╦════════════╦═══════════════════════════════════════╣
\x1b[1;32m║ \x1b[1;33mFilename     \x1b[1;32m║ \x1b[1;33mBytes    \x1b[1;32m║ \x1b[1;33mDate       \x1b[1;32m║ \x1b[1;33mDescription                           \x1b[1;32m║
\x1b[1;32m╠══════════════╬══════════╬════════════╬═══════════════════════════════════════╣
\x1b[1;32m║ \x1b[1;37mPCB1522.ZIP  \x1b[1;32m║ \x1b[0;36m1,420,892\x1b[1;32m║ \x1b[0;37m10-14-1994 \x1b[1;32m║ \x1b[0;37mPCBoard v15.22 Complete BBS Suite     \x1b[1;32m║
\x1b[1;32m║ \x1b[1;37mPKZ204G.EXE  \x1b[1;32m║ \x1b[0;36m  202,574\x1b[1;32m║ \x1b[0;37m03-01-1993 \x1b[1;32m║ \x1b[0;37mPKZIP / PKUNZIP v2.04g Compression    \x1b[1;32m║
\x1b[1;32m║ \x1b[1;37mTHEDRAW.ZIP  \x1b[1;32m║ \x1b[0;36m  312,880\x1b[1;32m║ \x1b[0;37m09-22-1993 \x1b[1;32m║ \x1b[0;37mTheDraw v4.63 Legendary ANSI Editor   \x1b[1;32m║
\x1b[1;32m║ \x1b[1;37mLORD400.ZIP  \x1b[1;32m║ \x1b[0;36m  685,410\x1b[1;32m║ \x1b[0;37m12-05-1994 \x1b[1;32m║ \x1b[0;37mLegend of the Red Dragon v4.00 Door   \x1b[1;32m║
\x1b[1;32m║ \x1b[1;37mSRE_SYS.ZIP  \x1b[1;32m║ \x1b[0;36m  450,210\x1b[1;32m║ \x1b[0;37m01-15-1995 \x1b[1;32m║ \x1b[0;37mSite Reliability Engineer Toolset 95  \x1b[1;32m║
\x1b[1;32m║ \x1b[1;37mTW2002.ZIP   \x1b[1;32m║ \x1b[0;36m  890,124\x1b[1;32m║ \x1b[0;37m04-20-1994 \x1b[1;32m║ \x1b[0;37mTradeWars 2002 Space Strategy Door    \x1b[1;32m║
\x1b[1;32m╚══════════════╩══════════╩════════════╩═══════════════════════════════════════╝\x1b[0m
`;

export const DOOR_LORD_INTRO = `
\x1b[2J\x1b[H
\x1b[1;31m╔══════════════════════════════════════════════════════════════════════════════╗
\x1b[1;31m║                     \x1b[1;33mLEGEND OF THE RED DRAGON (v4.00)                         \x1b[1;31m║
\x1b[1;31m║                   \x1b[1;37m(C) Copyright 1992-1994 Robinson Technologies              \x1b[1;31m║
\x1b[1;31m╠══════════════════════════════════════════════════════════════════════════════╣
\x1b[1;31m║ \x1b[0;37mYou stand in the courtyard of the Town of Red Dragon. Smoke rises from the   \x1b[1;31m║
\x1b[1;31m║ \x1b[0;37mdistant forest where a terrible dragon terrorizes the innocent peasants.     \x1b[1;31m║
\x1b[1;31m║                                                                              \x1b[1;31m║
\x1b[1;31m║ \x1b[1;33m[F] \x1b[0;37mEnter the Forest (Look for monsters)                                     \x1b[1;31m║
\x1b[1;31m║ \x1b[1;33m[I] \x1b[0;37mVisit the Red Dragon Inn (Talk to Violet, drink ale)                     \x1b[1;31m║
\x1b[1;31m║ \x1b[1;33m[W] \x1b[0;37mVisit Abduls Armor & Weapons Emporium                                    \x1b[1;31m║
\x1b[1;31m║ \x1b[1;33m[S] \x1b[0;37mView Your Warrior Character Stats                                        \x1b[1;31m║
\x1b[1;31m║ \x1b[1;33m[Q] \x1b[0;37mReturn to PCBoard BBS                                                    \x1b[1;31m║
\x1b[1;31m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m
`;

export const DOOR_TW2002_INTRO = `
\x1b[2J\x1b[H
\x1b[1;34m╔══════════════════════════════════════════════════════════════════════════════╗
\x1b[1;34m║                       \x1b[1;32mTRADEWARS 2002 (v2.00)                                 \x1b[1;34m║
\x1b[1;34m║                 \x1b[1;37m(C) Copyright 1990-1994 Gary Martin & Martech                \x1b[1;34m║
\x1b[1;34m╠══════════════════════════════════════════════════════════════════════════════╣
\x1b[1;34m║ \x1b[0;37mCommand [TL=00:45:00]: \x1b[1;33m[Sector 1]                                            \x1b[1;34m║
\x1b[1;34m║ \x1b[0;37mBeacon: \x1b[1;36mFederation StarDock - Free Trade Sector                              \x1b[1;34m║
\x1b[1;34m║ \x1b[0;37mPorts : \x1b[1;32mStarDock (Class 0: Special)                                          \x1b[1;34m║
\x1b[1;34m║ \x1b[0;37mWarp Paths lead to: \x1b[1;37m(2) - (3) - (4) - (5) - (6) - (7)                        \x1b[1;34m║
\x1b[1;34m║                                                                              \x1b[1;34m║
\x1b[1;34m║ \x1b[1;33m[D] \x1b[0;37mDock at StarDock                                                         \x1b[1;34m║
\x1b[1;33m║ [P] \x1b[0;37mPort Trade (Ore, Organics, Equipment)                                    \x1b[1;34m║
\x1b[1;33m║ [M] \x1b[0;37mMove / Warp to Adjacent Sector                                           \x1b[1;34m║
\x1b[1;33m║ [Q] \x1b[0;37mQuit to PCBoard BBS                                                      \x1b[1;34m║
\x1b[1;34m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m
`;

export const GOODBYE_SCREEN = `
\x1b[1;36m╔══════════════════════════════════════════════════════════════════════════════╗
\x1b[1;36m║                        \x1b[1;33mTHANK YOU FOR CALLING!                                \x1b[1;36m║
\x1b[1;36m║                  \x1b[1;37mTHE METROPOLIS PCBOARD BBS SYSTEM                           \x1b[1;36m║
\x1b[1;36m╠══════════════════════════════════════════════════════════════════════════════╣
\x1b[1;36m║  \x1b[0;37mConnect Time: \x1b[1;32m{CONNECT_TIME} minutes                                        \x1b[1;36m║
\x1b[1;36m║  \x1b[0;37mFiles Downloaded: \x1b[1;33m{FILES_DL} \x1b[0;37m| Uploaded: \x1b[1;33m{FILES_UL}                                 \x1b[1;36m║
\x1b[1;36m║  \x1b[0;37mSecurity Level: \x1b[1;35m{SECURITY_LEVEL} \x1b[0;37m| Node: \x1b[1;36m1                                      \x1b[1;36m║
\x1b[1;36m║                                                                              \x1b[1;36m║
\x1b[1;36m║  \x1b[1;32mClark Development Company, Inc. PCBoard v15.22                              \x1b[1;36m║
\x1b[1;36m╚══════════════════════════════════════════════════════════════════════════════╝\x1b[0m
`;
