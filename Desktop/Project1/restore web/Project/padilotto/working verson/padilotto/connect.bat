@echo off
echo open ftp.padilotto.com:21 > ftpcmd.txt
echo user admin@padilotto.com >> ftpcmd.txt
echo d!T+?RIkjl7E >> ftpcmd.txt
echo binary >> ftpcmd.txt
echo ls >> ftpcmd.txt
echo bye >> ftpcmd.txt
ftp -n -s:ftpcmd.txt
del ftpcmd.txt 