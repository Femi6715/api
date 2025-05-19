@echo off
echo open ftp.padilotto.com > ftpcmd.txt
echo user admin@padilotto.com >> ftpcmd.txt
echo d!T+?RIkjl7E >> ftpcmd.txt
echo binary >> ftpcmd.txt
echo cd / >> ftpcmd.txt
echo prompt >> ftpcmd.txt
echo mput "dist\*.*" >> ftpcmd.txt
echo bye >> ftpcmd.txt
ftp -n -s:ftpcmd.txt
del ftpcmd.txt 