f = open('sqlquery.txt','w')
for year in range(2004,2019):
    for round in range(1,22):
        if(year==2004 & round > 18):
            break;
        if(year==2005 & round > 19):
            break;
        if(year==2006 & round > 18):
            break;
        if(year==2007 & round > 17):
            break;
        if(year==2008 & round > 18):
            break;
        if(year==2009 & round > 17):
            break;
        if(year==2010 & round > 19):
            break;
        if(year==2011 & round > 19):
            break;
        if(year==2012 & round > 20):
            break;
        if(year==2013 & round > 19):
            break;
        if(year==2014 & round > 19):
            break;
        if(year==2015 & round > 19):
            break;
        if(year==2017 & round > 20):
            break;
        f.write(f'CREATE VIEW "{year}_{round}" AS\n')
        f.write(f'SELECT forename, surname, milliseconds FROM view_laptimes_final WHERE "year"={year} AND "round"={round};\n\n')
f.close()
